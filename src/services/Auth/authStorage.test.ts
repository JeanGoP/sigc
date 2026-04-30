import {
  AUTH_STORAGE_KEY,
  buildStoredUserAccess,
  buildUserFromSecurityData,
  buildUserFromSessionData,
  buildUserFromTokenPayload,
  buildUserFromUserAccess,
  parseStoredUserAccess,
  resolveAuthTokenFromUserAccess,
  resolveStoredAuthSession,
  resolveTenantIdFromUserAccess,
  saveStoredUserAccess,
} from "./authStorage";

describe("auth storage helpers", () => {
  it("returns null when stored user access is empty or invalid", () => {
    expect(parseStoredUserAccess(null)).toBeNull();
    expect(parseStoredUserAccess("")).toBeNull();
    expect(parseStoredUserAccess("{bad-json")).toBeNull();
  });

  it("resolves direct token and tenant id", () => {
    const userAccess = {
      token: "direct-token",
      tenantId: "tenant-a",
    };

    expect(resolveAuthTokenFromUserAccess(userAccess)).toBe("direct-token");
    expect(resolveTenantIdFromUserAccess(userAccess)).toBe("tenant-a");
  });

  it("resolves nested token object values kept by legacy login", () => {
    const userAccess = {
      token: {
        token: "nested-token",
        tenantId: "tenant-b",
      },
    };

    expect(resolveAuthTokenFromUserAccess(userAccess)).toBe("nested-token");
    expect(resolveTenantIdFromUserAccess(userAccess)).toBe("tenant-b");
  });

  it("resolves API response shaped data token values", () => {
    const userAccess = {
      data: {
        token: {
          token: "response-token",
          tenantId: "tenant-c",
        },
      },
    };

    expect(resolveAuthTokenFromUserAccess(userAccess)).toBe("response-token");
    expect(resolveTenantIdFromUserAccess(userAccess)).toBe("tenant-c");
  });

  it("keeps tenant-only sessions used before login", () => {
    const userAccess = {
      tenantId: "tenant-only",
    };

    expect(resolveAuthTokenFromUserAccess(userAccess)).toBe("");
    expect(resolveTenantIdFromUserAccess(userAccess)).toBe("tenant-only");
  });

  it("resolves the stored auth session from a storage reader", () => {
    const storage = {
      getItem: jest.fn().mockReturnValue(
        JSON.stringify({
          token: "stored-token",
          tenantId: "stored-tenant",
        })
      ),
    };

    expect(resolveStoredAuthSession(storage)).toEqual({
      token: "stored-token",
      tenantId: "stored-tenant",
      userAccess: {
        token: "stored-token",
        tenantId: "stored-tenant",
      },
    });
  });

  it("rejects stored user access without id and username", () => {
    expect(buildUserFromUserAccess(null)).toBeNull();
    expect(buildUserFromUserAccess({ tenantId: "tenant-only" })).toBeNull();
    expect(buildUserFromUserAccess({ id: "1" })).toBeNull();
  });

  it("builds a user from stored user access and preserves legacy token values", () => {
    const user = buildUserFromUserAccess({
      id: 7,
      username: "jlopez",
      fullName: "Juan Lopez",
      email: "",
      role: "asesor",
      token: {
        token: "legacy-token",
        tenantId: "legacy-tenant",
      },
      mustChangePassword: 1,
      telephonyEnabled: 0,
    });

    expect(user).toMatchObject({
      id: "7",
      username: "jlopez",
      password: "",
      fullName: "Juan Lopez",
      email: "jlopez",
      role: "asesor",
      token: "legacy-token",
      tenantId: "legacy-tenant",
      mustChangePassword: true,
      telephonyEnabled: false,
    });
  });

  it("builds a user from a validate-token payload", () => {
    const user = buildUserFromTokenPayload({
      userId: 9,
      username: "mgarcia",
      fullName: null,
      email: null,
      role: null,
      token: "payload-token",
      tenantId: null,
      mustChangePassword: false,
      telephonyEnabled: true,
    });

    expect(user).toMatchObject({
      id: "9",
      username: "mgarcia",
      fullName: "",
      email: "mgarcia",
      role: "",
      token: "payload-token",
      tenantId: "",
      mustChangePassword: false,
      telephonyEnabled: true,
    });
  });

  it("builds a user from session data using current user fallbacks", () => {
    const user = buildUserFromSessionData(
      {
        userId: 10,
        username: "arodriguez",
        fullName: "",
        email: "",
        role: "",
        tenantId: "",
      },
      {
        id: "old",
        username: "old",
        fullName: "Usuario Actual",
        email: "actual@example.com",
        role: "coordinador",
        token: "current-token",
        tenantId: "current-tenant",
        telephonyEnabled: true,
      }
    );

    expect(user).toMatchObject({
      id: "10",
      username: "arodriguez",
      fullName: "Usuario Actual",
      email: "actual@example.com",
      role: "coordinador",
      token: "current-token",
      tenantId: "current-tenant",
      mustChangePassword: false,
      telephonyEnabled: true,
    });
  });

  it("builds a refreshed user from security data preserving token from storage", () => {
    const user = buildUserFromSecurityData(
      {
        userId: 11,
        username: "dperez",
        fullName: "Diana Perez",
        email: "",
        role: "",
        tenantId: "security-tenant",
        mustChangePassword: true,
        telephonyEnabled: false,
      },
      {
        role: "admin",
        token: "stored-token",
        tenantId: "stored-tenant",
      }
    );

    expect(user).toMatchObject({
      id: "11",
      username: "dperez",
      fullName: "Diana Perez",
      email: "dperez",
      role: "admin",
      token: "stored-token",
      tenantId: "security-tenant",
      mustChangePassword: true,
      telephonyEnabled: false,
    });
  });

  it("serializes and stores the same user access shape used by the app", () => {
    const user = buildUserFromTokenPayload({
      userId: 12,
      username: "ctorres",
      fullName: "Carlos Torres",
      email: "ctorres@example.com",
      role: "admin",
      token: "token-to-store",
      tenantId: "tenant-to-store",
      mustChangePassword: false,
      telephonyEnabled: true,
    });

    const expectedUserAccess = {
      id: "12",
      username: "ctorres",
      fullName: "Carlos Torres",
      email: "ctorres@example.com",
      role: "admin",
      token: "token-to-store",
      tenantId: "tenant-to-store",
      mustChangePassword: false,
      telephonyEnabled: true,
    };

    expect(buildStoredUserAccess(user)).toEqual(expectedUserAccess);

    const storage = {
      setItem: jest.fn(),
    };

    saveStoredUserAccess(user, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      AUTH_STORAGE_KEY,
      JSON.stringify(expectedUserAccess)
    );
  });
});

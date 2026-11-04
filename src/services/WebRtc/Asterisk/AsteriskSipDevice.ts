import {
  UserAgent,
  Registerer,
  RegistererState,
  Inviter,
  Invitation,
  Session,
  SessionState,
  URI,
} from "sip.js";

export interface AsteriskSipConfig {
  wssUrl: string;
  domain: string;
  extension: string;
  password?: string;
  displayName?: string;
}

export interface AsteriskCallSession {
  callSid: string;
  direction: "outbound-client" | "inbound-client";
  from: string;
  to: string;
  disconnect: () => Promise<void>;
  mute: (isMuted: boolean) => void;
  sendDigits: (tones: string) => void;
  on: (event: "accept" | "disconnect" | "ringing" | "cancel" | "reject" | "error" | string, listener: (...args: any[]) => void) => void;
  off: (event: "accept" | "disconnect" | "ringing" | "cancel" | "reject" | "error" | string, listener: (...args: any[]) => void) => void;
  parameters: Record<string, string>;
}

export interface AsteriskIncomingCall {
  callSid: string;
  from: string;
  to: string;
  accept: () => Promise<AsteriskCallSession>;
  reject: () => Promise<void>;
  disconnect?: () => Promise<void>;
  mute?: (isMuted: boolean) => void;
  parameters: Record<string, string>;
  on: (event: "accept" | "disconnect" | "ringing" | "cancel" | "reject" | "error" | string, listener: (...args: any[]) => void) => void;
  off: (event: "accept" | "disconnect" | "ringing" | "cancel" | "reject" | "error" | string, listener: (...args: any[]) => void) => void;
}

type EventListener = (...args: any[]) => void;

export class AsteriskSipDevice {
  private config: AsteriskSipConfig;
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private currentSession: Session | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  public isRegistered = false;

  constructor(config: AsteriskSipConfig) {
    this.config = { ...config };
    this.ensureAudioElement();
  }

  public get identity(): string {
    return this.config.extension;
  }

  private ensureAudioElement(): HTMLAudioElement {
    if (typeof document === "undefined") return null as any;

    let audio = document.getElementById("asterisk-remote-audio") as HTMLAudioElement | null;
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "asterisk-remote-audio";
      document.body.appendChild(audio);
    }
    audio.autoplay = true;
    audio.muted = false;
    audio.volume = 1.0;
    audio.setAttribute("playsinline", "true");
    // CRUCIAL: Do NOT use display: none; in Chromium it silences/suspends WebRTC audio rendering.
    audio.style.position = "fixed";
    audio.style.bottom = "-9999px";
    audio.style.right = "-9999px";
    audio.style.width = "1px";
    audio.style.height = "1px";
    audio.style.opacity = "0.01";
    audio.style.pointerEvents = "none";
    audio.style.display = "block";

    this.remoteAudioElement = audio;
    return audio;
  }

  public on(event: "registered" | "unregistered" | "incoming" | "error", listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: string, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(...args);
        } catch (e) {
          console.error(`[AsteriskSipDevice] Error en listener de '${event}':`, e);
        }
      });
    }
  }

  public async register(): Promise<void> {
    const domain = this.config.domain || "mch.lab.nethexa.com";
    const extension = this.config.extension || "200";
    const password = this.config.password || "";
    const websocket = this.config.wssUrl || "wss://mch.lab.nethexa.com/ws";

    // Request microphone permission first
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("[AsteriskSipDevice] Advertencia de permiso de micrófono:", e);
      }
    }

    const uri = UserAgent.makeURI(`sip:${extension}@${domain}`);
    if (!uri) {
      throw new Error(`URI SIP inválido: sip:${extension}@${domain}`);
    }

    this.userAgent = new UserAgent({
      uri,
      authorizationUsername: extension,
      authorizationPassword: password,
      transportOptions: { server: websocket },
      delegate: {
        onInvite: (invitation: Invitation) => {
          this.handleIncomingInvitation(invitation);
        },
      },
    });

    this.registerer = new Registerer(this.userAgent);
    this.registerer.stateChange.addListener((state: RegistererState) => {
      if (state === RegistererState.Registered) {
        this.isRegistered = true;
        this.emit("registered");
      } else if (state === RegistererState.Unregistered || state === RegistererState.Terminated) {
        this.isRegistered = false;
        this.emit("unregistered");
      }
    });

    await this.userAgent.start();
    await this.registerer.register();
  }

  public async unregister(): Promise<void> {
    if (this.currentSession) {
      await this.hangupCurrentSession();
    }
    if (this.registerer) {
      try {
        await this.registerer.unregister();
      } catch {}
    }
    if (this.userAgent) {
      try {
        await this.userAgent.stop();
      } catch {}
    }
    this.userAgent = null;
    this.registerer = null;
    this.isRegistered = false;
    this.emit("unregistered");
  }

  public async connect(options: { to?: string; callerId?: string; tenantId?: string; params?: Record<string, string> }): Promise<AsteriskCallSession> {
    if (!this.userAgent || !this.isRegistered) {
      throw new Error("El cliente WebRTC no está conectado o registrado en Asterisk.");
    }

    // Pre-unlock audio playback within the user click gesture
    const audio = this.ensureAudioElement();
    if (audio) {
      audio.play().catch(() => {});
    }

    const rawTo = options.to || options.params?.to || "";
    let destination = rawTo.replace(/[^\d]/g, "");
    if (destination.startsWith("57") && destination.length === 12) {
      destination = destination.substring(2);
    }

    const domain = this.config.domain || "mch.lab.nethexa.com";
    const target = UserAgent.makeURI(`sip:${destination}@${domain}`);
    if (!target) {
      throw new Error(`Destino SIP inválido: sip:${destination}@${domain}`);
    }

    const sessionOptions = {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    };

    const inviter = new Inviter(this.userAgent, target, sessionOptions);
    this.currentSession = inviter;

    const callSid = `sip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sessionWrapper = this.createSessionWrapper(inviter, "outbound-client", this.config.extension, destination, callSid);

    await inviter.invite(sessionOptions);
    return sessionWrapper;
  }

  private handleIncomingInvitation(invitation: Invitation): void {
    const fromNumber = invitation.remoteIdentity.uri.user || invitation.remoteIdentity.displayName || "Desconocido";
    const toNumber = invitation.localIdentity.uri.user || this.config.extension;
    const callSid = invitation.request.callId || `sip-in-${Date.now()}`;

    this.currentSession = invitation;
    const wrapper = this.createSessionWrapper(invitation, "inbound-client", fromNumber, toNumber, callSid);

    const incoming: AsteriskIncomingCall = {
      callSid,
      from: fromNumber,
      to: toNumber,
      parameters: {
        CallSid: callSid,
        From: fromNumber,
        To: toNumber,
      },
      on: (event: string, listener: (...args: any[]) => void) => {
        wrapper.on(event, listener);
      },
      off: (event: string, listener: (...args: any[]) => void) => {
        wrapper.off(event, listener);
      },
      disconnect: async () => {
        await wrapper.disconnect();
      },
      mute: (isMuted: boolean) => {
        wrapper.mute(isMuted);
      },
      accept: async () => {
        this.ensureAudioElement();
        await invitation.accept({
          sessionDescriptionHandlerOptions: {
            constraints: { audio: true, video: false },
          },
        });
        return wrapper;
      },
      reject: async () => {
        try {
          await invitation.reject();
        } catch {}
      },
    };

    this.emit("incoming", incoming);
  }

  private createSessionWrapper(
    session: Session,
    direction: "outbound-client" | "inbound-client",
    from: string,
    to: string,
    callSid: string
  ): AsteriskCallSession {
    const sessionListeners = new Map<string, Set<EventListener>>();

    const emitSession = (event: string, ...args: any[]) => {
      sessionListeners.get(event)?.forEach((fn) => {
        try {
          fn(...args);
        } catch (e) {
          console.error(`[AsteriskCallSession] Error en listener de '${event}':`, e);
        }
      });
    };

    const wrapper: AsteriskCallSession = {
      callSid,
      direction,
      from,
      to,
      parameters: {
        CallSid: callSid,
        From: from,
        To: to,
      },
      on: (event, listener) => {
        if (!sessionListeners.has(event)) sessionListeners.set(event, new Set());
        sessionListeners.get(event)!.add(listener);
      },
      off: (event, listener) => {
        sessionListeners.get(event)?.delete(listener);
      },
      disconnect: async () => {
        await this.hangupCurrentSession();
      },
      mute: (isMuted: boolean) => {
        const sdh = session.sessionDescriptionHandler as any;
        const pc: RTCPeerConnection = sdh?.peerConnection;
        if (pc) {
          pc.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === "audio") {
              sender.track.enabled = !isMuted;
            }
          });
        }
      },
      sendDigits: (tones: string) => {
        (session as any).dtmf?.(tones);
      },
    };

    const monitorPeerConnection = () => {
      try {
        const sdh = session.sessionDescriptionHandler as any;
        const pc: RTCPeerConnection = sdh?.peerConnection;
        if (!pc) return;

        // Monitor RTCPeerConnection tracks
        pc.addEventListener("track", (event: RTCTrackEvent) => {
          console.log("[AsteriskSipDevice] Evento 'track' recibido en RTCPeerConnection:", event.track.kind, event.track.id);
          if (event.track.kind === "audio") {
            const audio = this.ensureAudioElement();
            if (audio) {
              if (event.streams && event.streams[0]) {
                audio.srcObject = event.streams[0];
              } else {
                audio.srcObject = new MediaStream([event.track]);
              }
              audio.play().catch((err) => console.warn("[AsteriskSipDevice] Error en play() al recibir track:", err));
            }

            event.track.addEventListener("unmute", () => {
              console.log("[AsteriskSipDevice] Track de audio remoto desmuteado (flujo RTP activo)");
              audio?.play().catch(() => {});
            });
          }
        });

        // Monitor ICE connection status
        pc.addEventListener("iceconnectionstatechange", () => {
          console.log(`[AsteriskSipDevice] WebRTC ICE State: ${pc.iceConnectionState}`);
          if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
            console.warn(`[AsteriskSipDevice] WebRTC ICE ${pc.iceConnectionState}. Verifica si la VPN Nethexa está activa.`);
          }
        });

        pc.addEventListener("connectionstatechange", () => {
          console.log(`[AsteriskSipDevice] WebRTC PeerConnection State: ${pc.connectionState}`);
        });
      } catch (err) {
        console.warn("[AsteriskSipDevice] Error configurando monitoreo de PeerConnection:", err);
      }
    };

    let wasEstablished = false;

    session.stateChange.addListener((state: SessionState) => {
      console.log(`[AsteriskSipDevice] Estado de sesión SIP: ${state}`);
      if (state === SessionState.Establishing) {
        monitorPeerConnection();
        emitSession("ringing", wrapper);
      } else if (state === SessionState.Established) {
        wasEstablished = true;
        monitorPeerConnection();
        this.attachRemoteAudio(session);
        emitSession("accept", wrapper);
      } else if (state === SessionState.Terminated) {
        this.detachRemoteAudio();
        if (this.currentSession === session) {
          this.currentSession = null;
        }
        if (!wasEstablished) {
          emitSession("cancel", wrapper);
          emitSession("reject", wrapper);
        }
        emitSession("disconnect", wrapper);
      }
    });

    return wrapper;
  }

  private attachRemoteAudio(session: Session): void {
    try {
      const sdh = session.sessionDescriptionHandler as any;
      const pc: RTCPeerConnection = sdh?.peerConnection;
      const audio = this.ensureAudioElement();
      if (!audio) return;

      const playAudio = () => {
        audio.play().then(() => {
          console.log("[AsteriskSipDevice] Reproductor de audio remoto activo.");
        }).catch((e) => {
          console.warn("[AsteriskSipDevice] Autoplay de audio diferido por el navegador:", e);
        });
      };

      // 1. Prioritize sdh.remoteMediaStream maintained by SIP.js
      if (sdh?.remoteMediaStream && sdh.remoteMediaStream.getAudioTracks().length > 0) {
        console.log("[AsteriskSipDevice] Adjuntando sdh.remoteMediaStream con", sdh.remoteMediaStream.getAudioTracks().length, "pistas de audio");
        audio.srcObject = sdh.remoteMediaStream;
        playAudio();
        return;
      }

      // 2. Fallback: collect receivers from peerConnection
      if (pc) {
        const stream = new MediaStream();
        pc.getReceivers().forEach((receiver) => {
          if (receiver.track && receiver.track.kind === "audio") {
            stream.addTrack(receiver.track);
          }
        });

        if (stream.getAudioTracks().length > 0) {
          console.log("[AsteriskSipDevice] Adjuntando stream desde pc.getReceivers():", stream.getAudioTracks().length, "pistas");
          audio.srcObject = stream;
          playAudio();
        } else {
          console.log("[AsteriskSipDevice] Aún no hay pistas en receivers; se activarán vía evento 'track'.");
        }
      }
    } catch (e) {
      console.error("[AsteriskSipDevice] Error adjuntando audio remoto:", e);
    }
  }

  private detachRemoteAudio(): void {
    if (this.remoteAudioElement) {
      try {
        this.remoteAudioElement.pause();
        this.remoteAudioElement.srcObject = null;
      } catch {}
    }
  }

  private async hangupCurrentSession(): Promise<void> {
    if (!this.currentSession) return;
    const session = this.currentSession;
    this.currentSession = null;

    try {
      if (session.state === SessionState.Initial || session.state === SessionState.Establishing) {
        if (session instanceof Inviter) {
          await session.cancel();
        } else if (session instanceof Invitation) {
          await session.reject();
        }
      } else if (session.state === SessionState.Established) {
        await session.bye();
      }
    } catch (e) {
      console.warn("[AsteriskSipDevice] Error al colgar sesión:", e);
    } finally {
      this.detachRemoteAudio();
    }
  }
}

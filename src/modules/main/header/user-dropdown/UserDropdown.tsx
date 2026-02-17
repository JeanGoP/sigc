import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StyledBigUserImage, StyledSmallUserImage } from '@app/styles/common';
// import usr from '../../../../../public/user-solid.svg';
import {
  UserBody,
  UserFooter,
  UserHeader,
  UserMenuDropdown,
} from '@app/styles/dropdown-menus';
// import { firebaseAuth } from '@app/firebase';
import {} from '@app/index';
import {useAppSelector } from '@app/store/store';
import { useSessionService } from '@app/services/Auth/ValidateToken';
// import { DateTime } from 'luxon';
import { saveObjectToLocalStorage } from '@app/utils/localStorageHandler';


const UserDropdown = () => {
  const navigate = useNavigate();
  const [t] = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logout } = useSessionService();

  const logOut = async (event: any) => {
    event.preventDefault();
    setDropdownOpen(false);

    try {
      await logout();
    } catch {
      // ignore
    } finally {
      saveObjectToLocalStorage('userAccess', null);
      window.location.reload();
    }
  };

  const navigateToProfile = (event: any) => {
    event.preventDefault();
    setDropdownOpen(false);
    navigate('/profile');
  };

  const navigateToChangePassword = (event: any) => {
    event.preventDefault();
    setDropdownOpen(false);
    navigate('/cambiar-contrasena');
  };

  return (
    <UserMenuDropdown isOpen={dropdownOpen} hideArrow>
      <StyledSmallUserImage
        slot="head"
        src={'/public/user-solid.svg'}
        fallbackSrc="/img/default-profile.png"
        alt="User"
        width={25}
        height={25}
        rounded
      />
      <div slot="body">
        <UserHeader className=" bg-primary">
          <StyledBigUserImage
            src={'/public/user-solid.svg'}
            fallbackSrc="/img/default-profile.png"
            alt="User"
            width={90}
            height={90}
            rounded
          />
          <p>
            {currentUser?.email}
            <small>
              {/* <span>Member since </span>
              {currentUser?.metadata?.creationTime && (
                <span>
                  {DateTime.fromRFC2822(
                    currentUser?.metadata?.creationTime
                  ).toFormat('dd LLL yyyy')}
                </span>
              )} */}
            </small>
          </p>
        </UserHeader>
        <UserBody>
          <div className="row">
            <div className="col-4 text-center">
              <Link to="/">{t('header.user.followers')}</Link>
            </div>
            <div className="col-4 text-center">
              <Link to="/">{t('header.user.sales')}</Link>
            </div>
            <div className="col-4 text-center">
              <Link to="/">{t('header.user.friends')}</Link>
            </div>
          </div>
        </UserBody>
        <UserFooter>
          <button
            type="button"
            className="btn btn-default btn-flat"
            onClick={navigateToProfile}
          >
            {t('header.user.profile')}
          </button>
          <button
            type="button"
            className="btn btn-default btn-flat"
            onClick={navigateToChangePassword}
          >
            Cambiar contrasena
          </button>
          <button
            type="button"
            className="btn btn-default btn-flat float-right"
            onClick={logOut}
          >
            {/* {t('login.button.signOut')} */}
            Cerrar sesión
          </button>
        </UserFooter>
      </div>
    </UserMenuDropdown>
  );
};

export default UserDropdown;

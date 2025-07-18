import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { setCurrentUser } from '@store/reducers/auth';
import { setWindowClass } from '@app/utils/helpers';
import { Checkbox } from '@profabric/react-components';
import * as Yup from 'yup';

import { Form, InputGroup } from 'react-bootstrap';
import { Button } from '@app/styles/common';
import { loginWithEmail } from '@app/services/auth';
import { useAppDispatch } from '@app/store/store';
import { saveObjectToLocalStorage } from '@app/utils/localStorageHandler';

const Login = () => {
  const [isAuthLoading, setAuthLoading] = useState(false);
  const [isGoogleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [isFacebookAuthLoading, setFacebookAuthLoading] = useState(false);
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const [t] = useTranslation();

  const login = async (username: string, password: string) => {
    try {
      setAuthLoading(true);
      const user = await loginWithEmail(username, password);
      console.log(user);
      dispatch(setCurrentUser(user));
      if (user != null) 
        toast.success('Login is succeed!');

      if (user == null)
        toast.error('Login is Failure!');

      saveObjectToLocalStorage('userAccess', user);
        
      setAuthLoading(false);
      navigate('/');
    } catch (error: any) {
      setAuthLoading(false);
      toast.error(error.message || 'Failed');
    }
  };

  // const loginByGoogle = async () => {
  //   try {
  //     setGoogleAuthLoading(true);
  //     await signInByGoogle();
  //     toast.success('Login is succeed!');
  //     setGoogleAuthLoading(false);
  //   } catch (error: any) {
  //     setGoogleAuthLoading(false);
  //     toast.error(error.message || 'Failed');
  //   }
  // };

  const loginByFacebook = async () => {
    try {
      setFacebookAuthLoading(true);
      throw new Error('Not implemented');
    } catch (error: any) {
      setFacebookAuthLoading(false);
      toast.error(error.message || 'Failed');
    }
  };

  const { handleChange, values, handleSubmit, touched, errors } = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Required'),
      password: Yup.string()
        .min(5, 'Must be 5 characters or more')
        .max(30, 'Must be 30 characters or less')
        .required('Required'),
    }),
    onSubmit: (values) => {
      login(values.username, values.password);
    },
  });

  setWindowClass('hold-transition login-page');

  return (
    <div className="login-box">
      <div className="card card-outline card-primary">
        <div className="card-header text-center">
          <Link to="/" className="h1">
            {/* <b>Admin</b>
            <span>LTE</span> */}
            <b>SIGC</b>
            <span> Montelibano</span>
            <img style={{width:"300px"}} id="img_logomym" src="/logoinversionesmotosycarros.png" alt=""/>
          </Link>
        </div>
        <div className="card-body">
          <p className="login-box-msg">{t('login.label.signIn')}</p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <InputGroup className="mb-3">
                <Form.Control
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username"
                  onChange={handleChange}
                  value={values.username}
                  isValid={touched.username && !errors.username}
                  isInvalid={touched.username && !!errors.username}
                />
                {touched.username && errors.username ? (
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                ) : (
                  <InputGroup.Append>
                    <InputGroup.Text>
                      <i className="fas fa-user" />
                    </InputGroup.Text>
                  </InputGroup.Append>
                )}
              </InputGroup>
            </div>
            <div className="mb-3">
              <InputGroup className="mb-3">
                <Form.Control
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  onChange={handleChange}
                  value={values.password}
                  isValid={touched.password && !errors.password}
                  isInvalid={touched.password && !!errors.password}
                />
                {touched.password && errors.password ? (
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                ) : (
                  <InputGroup.Append>
                    <InputGroup.Text>
                      <i className="fas fa-lock" />
                    </InputGroup.Text>
                  </InputGroup.Append>
                )}
              </InputGroup>
            </div>

            <div className="row">
              {/* <div className="col-8">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox checked={false} />
                  <label style={{ margin: 0, padding: 0, paddingLeft: '4px' }}>
                    {t('login.label.rememberMe')}
                  </label>
                </div>
              </div> */}
              <div className="col-12" style={{ display: 'flex', alignItems: 'center' }} >
                <Button
                  loading={isAuthLoading}
                  disabled={isFacebookAuthLoading || isGoogleAuthLoading}
                  onClick={handleSubmit as any}
                >
                  {t('login.button.signIn.label')}
                </Button>
              </div>
            </div>
          </form>
          {/* <div className="social-auth-links text-center mt-2 mb-3">
            <Button
              className="mb-2"
              onClick={loginByFacebook}
              loading={isFacebookAuthLoading}
              disabled={true || isAuthLoading || isGoogleAuthLoading}
            >
              <i className="fab fa-facebook mr-2" />
              {t('login.button.signIn.social', {
                what: 'Facebook',
              })}
            </Button>
            <Button
              variant="danger"
              // onClick={loginByGoogle}
              loading={isGoogleAuthLoading}
              disabled={isAuthLoading || isFacebookAuthLoading}
            >
              <i className="fab fa-google mr-2" />
              {t('login.button.signIn.social', { what: 'Google' })}
            </Button> 
          </div>*/}
          <p className="mb-1">
            <Link to="/forgot-password">{t('login.label.forgotPass')}</Link>
          </p>
          <p className="mb-0">
            <Link to="/register" className="text-center">
              {t('login.label.registerNew')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

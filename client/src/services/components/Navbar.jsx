import { Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const publicNavigation = [
  { name: 'Home', href: '/' },
  { name: 'First Aid', href: '/first-aid' },
];

const privateNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Contacts', href: '/contacts' },
  { name: 'History', href: '/history' },
  { name: 'First Aid', href: '/first-aid' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = user ? privateNavigation : publicNavigation;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Disclosure as="nav" className="bg-white shadow-sm sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <Link to="/" className="flex flex-shrink-0 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emergency-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">ZD</span>
                    </div>
                    <span className="font-bold text-xl text-gray-900">ZeroDelay</span>
                  </div>
                </Link>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        location.pathname === item.href
                          ? 'border-emergency-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
                {user ? (
                  <>
                    <Link
                      to="/emergency"
                      className="btn-primary emergency-button"
                    >
                      🚨 Emergency
                    </Link>
                    
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center gap-2 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
                        <span className="sr-only">Open user menu</span>
                        <div className="w-8 h-8 rounded-full bg-emergency-100 flex items-center justify-center">
                          <span className="text-emergency-600 font-medium">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="px-4 py-2 border-b">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/profile"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Profile
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block w-full text-left px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                      Sign in
                    </Link>
                    <Link to="/register" className="btn-primary">
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={classNames(
                    location.pathname === item.href
                      ? 'border-emergency-500 bg-emergency-50 text-emergency-700'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700',
                    'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            {user ? (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-emergency-100 flex items-center justify-center">
                      <span className="text-emergency-600 font-medium text-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.name}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Disclosure.Button
                    as={Link}
                    to="/emergency"
                    className="block w-full mx-4 mr-8 text-center btn-primary"
                  >
                    🚨 Emergency
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Profile
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Sign out
                  </Disclosure.Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex flex-col gap-2 px-4">
                  <Link to="/login" className="btn-secondary text-center">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary text-center">
                    Get Started
                  </Link>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

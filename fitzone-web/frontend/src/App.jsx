import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AccountOrders from './pages/AccountOrders.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminCategories from './pages/AdminCategories.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';

const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'));
const AdminProducts = lazy(() => import('./pages/AdminProducts.jsx'));
const AdminHero = lazy(() => import('./pages/AdminHero.jsx'));

function getRoute() {
  return `${window.location.pathname}${window.location.search}`;
}

export default function App() {
  const [route, setRoute] = useState(getRoute());
  const lenisRef = useRef(null);

  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  function navigate(path) {
    window.history.pushState({}, '', path);
    setRoute(getRoute());
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0 });
  }

  const routePath = route.split('?')[0];
  let page;
  if (routePath === '/') page = <Home navigate={navigate} />;
  else if (routePath === '/products') page = <Products key={route} navigate={navigate} />;
  else if (routePath.startsWith('/products/')) page = <ProductDetails slug={routePath.replace('/products/', '')} navigate={navigate} />;
  else if (routePath === '/cart') page = <Cart navigate={navigate} />;
  else if (routePath === '/checkout') page = <Checkout navigate={navigate} />;
  else if (routePath === '/login') page = <Login navigate={navigate} />;
  else if (routePath === '/register') page = <Register navigate={navigate} />;
  else if (routePath === '/account/orders') page = <AccountOrders navigate={navigate} />;
  else if (routePath === '/admin') page = <AdminDashboard navigate={navigate} />;
  else if (routePath === '/admin/products') page = <AdminProducts navigate={navigate} />;
  else if (routePath === '/admin/categories') page = <AdminCategories navigate={navigate} />;
  else if (routePath === '/admin/hero') page = <AdminHero navigate={navigate} />;
  else if (routePath === '/admin/orders') page = <AdminOrders navigate={navigate} />;
  else if (routePath.startsWith('/order-success')) page = <OrderSuccess navigate={navigate} />;
  else page = <Home navigate={navigate} />;

  return (
    <>
      <Header navigate={navigate} route={routePath} />
      <main><Suspense fallback={<section className="container empty"><p>Loading page...</p></section>}>{page}</Suspense></main>
      <Footer navigate={navigate} />
    </>
  );
}

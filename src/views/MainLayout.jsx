import { Outlet, NavLink } from "react-router-dom";

import { observer } from "mobx-react-lite";

import useStore from "@/hooks/useStore.js";


function MainLayout() {
    const store = useStore();

    function activClassNavlink({ isActive }) {
        return isActive ? 'header__menu-link--active header__menu-link' : 'header__menu-link';
    }

    return (
        <>
            <header className="header">
                <div className="content">
                    <div className="header__inner">
                        <NavLink className={activClassNavlink} to="/">Home</NavLink>
                        <nav className="header__menu">
                            <NavLink className={activClassNavlink} to="/dedicated">Dedicated</NavLink>
                            <NavLink className={activClassNavlink} to="/cart">
                                <span>Cart </span>
                                {store.cart.getNumberItemsCart != 0 && <span>({store.cart.getNumberItemsCart})</span>}
                            </NavLink>
                            <button className="header__menu-link" onClick={() => { store.global.setToggleColorTheme() }}>&#9788;</button>
                        </nav>
                        <button className="header__btn-menu" type="button"><span>Menu</span> <span>&#8595; &#8593;</span></button>
                    </div>
                </div>
            </header>
            <main className="main">
                <Outlet />
            </main>
        </>
    )
}

let observedMainLayout = observer(MainLayout);
export default observedMainLayout;
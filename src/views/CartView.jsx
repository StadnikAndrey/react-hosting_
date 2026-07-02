import { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import useStore from "@/hooks/useStore.js";
import { useNavigate } from "react-router-dom";

function CartView() {
    const navigate = useNavigate();
    const store = useStore();
    let [cart, setCart] = useState(null);
    useEffect(() => {
        let cartData = localStorage.getItem('cart');
        cartData = JSON.parse(cartData);
        setCart(structuredClone(cartData));
        return () => {
            setCart(null);
        }
    }, []);

    function deleteCartItem(e, index) {
        let cartCopy = structuredClone(cart);
        cartCopy = cartCopy.filter((el, ind) => {
            return ind != index;
        })
        setCart([...cartCopy]);
        localStorage.setItem('cart', JSON.stringify(cartCopy));
        store.cart.setNumberItemsCart();
    }
    function deleteIpCartItem(e, index) {
        let cartCopy = structuredClone(cart);
        let targetCartItem = cartCopy[index];
        targetCartItem.ip = {
            ...targetCartItem.ip,
            qt: 0
        }
        setCart([...cartCopy]);
        localStorage.setItem('cart', JSON.stringify(cartCopy));
    }
    function deleteSoftCartItem(e, indexCartItem, indexSoftItem) {
        let cartCopy = structuredClone(cart);
        let targetCartItem = cartCopy[indexCartItem];
        let targetSoftItem = targetCartItem.soft[indexSoftItem];
        targetSoftItem.checked = false;
        setCart([...cartCopy]);
        localStorage.setItem('cart', JSON.stringify(cartCopy));
    }
    function totalCartPrice() {
        let res = 0;
        let totalPrice = cart.reduce((acc, el) => {
            acc += el.payForYear ? el.totalPriceServer * 12 : el.totalPriceServer;

            if (el.ip.qt > 0) {
                acc += el.payForYear ? el.ip.total_price12 : el.ip.total_price;
            }

            let totalPriceSoftCartItem = el.soft.reduce((accPriceSoft, softItem) => {
                if (softItem.checked === true) {
                    accPriceSoft += el.payForYear ? softItem.price12m * 12 : softItem.price;
                }
                return accPriceSoft;
            }, 0);
            acc += totalPriceSoftCartItem;

            return acc;
        }, 0);

        res += totalPrice;
        return Math.round(res * 100) / 100;
    }
    function sendOrder() {
        setCart(null);
        localStorage.removeItem('cart');
        store.cart.setNumberItemsCart();
        navigate('/sign-in');
    }
    return (
        <section className="cart">
            {cart != null && cart.length > 0 && <div className="content">
                <h1 className="cart__title">Cart</h1>
                <div className="cart__content">
                    <div className="cart__items">
                        <div>COLOR THEME - {store.global.getColorTheme}</div>
                        {
                            cart.map((cartItem, indexCartItem) => {
                                return (
                                    <div className="cart__item" key={cartItem.uid}>
                                        <div className="cart__item-part">
                                            <div className="cart__part-data">
                                                <div className="cart__part-data-title">Dedicated server {cartItem.server.name}</div>
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">Chassis:</div>
                                                    <div className="cart__part-data-value">{cartItem.server.description}</div>
                                                </div>
                                                {cartItem.cpu != undefined && (<div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">CPU:</div>
                                                    <div className="cart__part-data-value">
                                                        {cartItem.cpu.cpuInstallNumber}x {
                                                            cartItem.cpu.cpuCanBeInstall.find((el) => { return el.id == cartItem.cpu.partId }).name
                                                        }
                                                    </div>
                                                </div>)}
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">RAM:</div>
                                                    <div className="cart__part-data-value">{cartItem?.ram?.value} {cartItem?.ram?.part?.class_desc?.params?.units}</div>
                                                </div>
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">DISKS:</div>
                                                    <div className="cart__part-data-value">
                                                        {cartItem.drives.drivesSlots.map((slot) => {
                                                            return (
                                                                <p key={slot.key} style={{ marginBottom: '4px' }}>
                                                                    {
                                                                        slot.canBeInstall.find((item) => {
                                                                            return item.id == slot.part_id;
                                                                        })?.description
                                                                    }
                                                                </p>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                {cartItem.bus != undefined
                                                    && cartItem.bus.slots.some((el) => el.part_id != null)
                                                    && (<div className="cart__part-data-item">
                                                        <div className="cart__part-data-name">Extension board:</div>
                                                        <div className="cart__part-data-value">
                                                            {cartItem.bus.slots.map((slot) => {
                                                                return (
                                                                    <div className="cart__part-ext-board" key={slot.key}>
                                                                        {slot.part_id != null &&
                                                                            (<div>
                                                                                <div>
                                                                                    {slot.boards.find((board) => {
                                                                                        return board.id == slot.part_id;
                                                                                    })?.description}
                                                                                </div>
                                                                            </div>)
                                                                        }
                                                                        {slot.part_id != null &&
                                                                            slot.boards[slot.selectedBusIndex].driveSlots.map((driveSlot) => {
                                                                                return (
                                                                                    <div className="cart__part-ext-board-disks" key={driveSlot.key}>
                                                                                        <p>
                                                                                            {driveSlot.drives.find((drive) => {
                                                                                                return drive.id == driveSlot.part_id;
                                                                                            })?.description}
                                                                                        </p>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>)}
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">Port:</div>
                                                    <div className="cart__part-data-value">{cartItem.server.port}</div>
                                                </div>
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">Bandwidth:</div>
                                                    <div className="cart__part-data-value">{cartItem.server.traffic}</div>
                                                </div>
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">Setup time:</div>
                                                    <div className="cart__part-data-value">{cartItem.server.comment}</div>
                                                </div>
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">Location:</div>
                                                    <div className="cart__part-data-value"> {cartItem.server.dc_name}</div>
                                                </div>
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">Operation system:</div>
                                                    <div className="cart__part-data-value">{cartItem.os}</div>
                                                </div>
                                            </div>
                                            <div className="cart__part-price">
                                                ${cartItem.totalPriceServer} <small style={{ 'fontWeight': 300 }}>X</small> {cartItem.payForYear ? '12 months' : ' 1 month'}
                                            </div>
                                            <div className="cart__part-delete">
                                                <button type="button" onClick={(e) => deleteCartItem(e, indexCartItem)}>&#10006;</button>
                                            </div>
                                        </div>
                                        {cartItem.ip.qt > 0 && (<div className="cart__item-part">
                                            <div className="cart__part-data">
                                                <div className="cart__part-data-title">Extra IP</div>
                                                <div className="cart__part-data-item">
                                                    <div className="cart__part-data-name">qt.:</div>
                                                    <div className="cart__part-data-value">{cartItem.ip.qt}  pcs.</div>
                                                </div>
                                            </div>
                                            <div className="cart__part-price">
                                                {cartItem.payForYear &&
                                                    <p>
                                                        <span>{cartItem.ip.qt} </span>
                                                        <small style={{ 'fontWeight': 300 }}>X </small>
                                                        <span>${cartItem.ip.price12} </span>
                                                        <small style={{ 'fontWeight': 300 }}>X </small>
                                                        <span>12 months</span>
                                                    </p>}

                                                {cartItem.payForYear == false &&
                                                    <p>
                                                        <span>{cartItem.ip.qt} </span>
                                                        <small style={{ 'fontWeight': 300 }}>X </small>
                                                        <span>${cartItem.ip.price} </span>
                                                        <small style={{ 'fontWeight': 300 }}>X </small>
                                                        <span>1 month</span></p>}
                                            </div>
                                            <div className="cart__part-delete">
                                                <button type="button" onClick={(e) => deleteIpCartItem(e, indexCartItem)}>&#10006;</button>
                                            </div>
                                        </div>)}

                                        {cartItem.soft.some((el) => el.checked == true)
                                            && (
                                                cartItem.soft.map((softItem, indexSoftItem) => {
                                                    return (
                                                        softItem.checked == true && (
                                                            <div className="cart__item-part" key={softItem.id}>
                                                                <div className="cart__part-data">
                                                                    <div className="cart__part-data-title">{softItem.name}</div>
                                                                </div>
                                                                <div className="cart__part-price">
                                                                    {softItem.price == 0 && <p>free</p>}
                                                                    {softItem.price != 0 && <div>
                                                                        {cartItem.payForYear &&
                                                                            (<p>
                                                                                <span>${softItem.price12m} </span>
                                                                                <small style={{ 'fontWeight': 300 }}>X </small>
                                                                                <span> 12 months</span>
                                                                            </p>)}

                                                                        {cartItem.payForYear == false &&
                                                                            (<p>
                                                                                <span>${softItem.price} </span>
                                                                                <small style={{ 'fontWeight': 300 }}>X </small>
                                                                                <span> 1 month</span>
                                                                            </p>)}
                                                                    </div>}
                                                                </div>
                                                                <div className="cart__part-delete">
                                                                    <button type="button" onClick={(e) => deleteSoftCartItem(e, indexCartItem, indexSoftItem)}>&#10006;</button>
                                                                </div>
                                                            </div>
                                                        )
                                                    )
                                                })
                                            )}
                                    </div>
                                )
                            })
                        }

                    </div>
                    <div className="cart__total">
                        <div className="cart__total-inner">
                            <div className="cart__total-price">
                                <div className="cart__total-price-title">Total payable:</div>
                                <div className="cart__total-price-value">${totalCartPrice()}</div>
                            </div>
                            <button className="cart__total-btn" type="button" onClick={sendOrder}>ORDER</button>
                        </div>
                    </div>
                </div>
            </div>}
            {
                (cart == null || (cart != null && cart?.length == 0)) && <div className="content">Cart is empty!</div>
            }
        </section>
    )
}

let observedCartView = observer(CartView);
export default observedCartView;
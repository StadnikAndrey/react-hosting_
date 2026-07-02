import { makeAutoObservable } from "mobx";

class CartStore {
    numberItemsCart;
    constructor(rootStore) {
        makeAutoObservable(this);
        this.rootStore = rootStore;
        this.setNumberItemsCart();
    }

    get getNumberItemsCart() {
        return this.numberItemsCart;
    }

    setNumberItemsCart() {
        let cart = localStorage.getItem('cart');
        let res = 0;
        if (cart != null) {
            res = JSON.parse(cart).length;
        }
        this.numberItemsCart = res;
    }
}

export default CartStore;
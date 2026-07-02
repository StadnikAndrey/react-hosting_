import GlobalStore from "./modules/global.js";
import AuthStore from "./modules/auth.js";
import CartStore from "./modules/cart.js";

class RootStore {
    constructor() {
        this.global = new GlobalStore(this);
        this.auth = new AuthStore(this);
        this.cart = new CartStore(this);
    }
}

function createRootStore() {
    return new RootStore();
}
export default createRootStore;
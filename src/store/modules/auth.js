import { makeAutoObservable } from "mobx";

class AuthStore {
    user = null;
    id = null;

    constructor(rootStore) {
        makeAutoObservable(this);
        this.rootStore = rootStore;
        this.id = Math.random();
    }

    get isAuth() {
        return this.user !== null;
    }

    signIn() {

    }
    signOut() {

    }
}

export default AuthStore;
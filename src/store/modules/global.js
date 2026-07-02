import { makeAutoObservable } from "mobx";

class GlobalStore {
    colorThemeDefault;
    colorThemeCurrent;

    constructor(rootStore) {
        makeAutoObservable(this);
        this.rootStore = rootStore;
        this.colorThemeDefault = 'light';
        this.colorThemeCurrent = '';
    }

    get getColorTheme() {
        return this.colorThemeCurrent;
    }

    setInitialColorTheme() {
        let theme = localStorage.getItem('colorTheme');
        if (theme == null) {
            theme = this.colorThemeDefault;
        }
        this.colorThemeCurrent = theme;
        localStorage.setItem('colorTheme', theme);
        document.documentElement.className = theme;
    }
    setToggleColorTheme() {
        let theme = localStorage.getItem('colorTheme');
        let colorTheme = '';
        if (theme == null) {
            colorTheme = this.colorThemeDefault;
        } else {
            colorTheme = theme == 'light' ? 'dark' : 'light';
        }
        this.colorThemeCurrent = colorTheme;
        localStorage.setItem('colorTheme', colorTheme);
        document.documentElement.className = colorTheme;
    }
}

export default GlobalStore;
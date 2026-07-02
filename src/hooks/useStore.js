import { useContext } from "react";
import StoreContext from "@/contexts/storeContext.js";

export default function useStore() {
    let store = useContext(StoreContext);
    return store;
}
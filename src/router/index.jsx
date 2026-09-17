import { createBrowserRouter } from "react-router-dom";

import MainLayoutView from "@/views/MainLayout.jsx";
import SignInView from "@/views/SignInView.jsx"
import SignUpView from "@/views/SignUpView.jsx";
import DedicatedView from "@/views/DedicatedView.jsx";
import DedicatedTariffView from "@/views/DedicatedTariffView.jsx";
import CartView from "@/views/CartView.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayoutView />,
        children: [
            {
                path: "",                 
                element: <DedicatedView />,
            },
            {
                path: "tariff-dedicated/:id",
                element: <DedicatedTariffView />
            },
            {
                path: "cart",
                element: <CartView />,
            },
        ],
    },
    {
        path: "sign-up",
        element: <SignUpView />,
    },
    {
        path: "sign-in",
        element: <SignInView />,
    },
    {
        path: "*",
        element: <div>error. page not found.</div>,
    },

]);

export default router;
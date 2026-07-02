import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { NavLink } from "react-router-dom";
import useStore from "@/hooks/useStore.js";
import { apiDedicated } from "@/api/index.js";

function DedicatedView() {
    const store = useStore();
    let [list, setList] = useState(null);
    useEffect(() => {
        (async () => {
            let res = await apiDedicated.getDedicatedList().catch((err) => console.log(err));
            setList(structuredClone(res));
        })();
        return () => {
            setList(null);
        }
    }, []);

    return (
        <>
            <section className="dedicated">
                <div className="content">
                    <h1 className="dedicated__title">Dedicated Servers Pricing</h1>
                    <div className="dedicated__list">
                        <div>COLOR THEME - {store.global.getColorTheme}</div>
                        {!list && <div>Loading ...</div>}
                        <div>{list?.length}</div>
                        {list && list.map((item) => {
                            return (<div className="dedicated__item" key={item.id}>
                                <div className="dedicated__item-base">
                                    <div className="dedicated__item-price">
                                        <p className="dedicated__item-price-year">${item.price12m} yearly</p>
                                        <p className="dedicated__item-price-month">${item.price} monthly</p>
                                    </div>
                                    <div className="dedicated__item-info">
                                        <ul>
                                            <li className="dedicated__item-info-li">
                                                <span className="dedicated__item-info-name"></span>
                                                <span className="dedicated__item-info-value dedicated__item-name">{item.name}</span>
                                            </li>
                                            <li className="dedicated__item-info-li">
                                                <span className="dedicated__item-info-name">CPU</span>
                                                <span className="dedicated__item-info-value">{item.CPU}, {item.description}</span>
                                            </li>
                                            <li className="dedicated__item-info-li">
                                                <span className="dedicated__item-info-name">RAM</span>
                                                <span className="dedicated__item-info-value">{item.RAM}</span>
                                            </li>
                                            <li className="dedicated__item-info-li">
                                                <span className="dedicated__item-info-name">Disk Drive</span>
                                                <span className="dedicated__item-info-value">{item.HDD}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="dedicated__item-cta">
                                    <NavLink className="dedicated__item-link" to={`/tariff-dedicated/${item.id}`}>Get Started</NavLink>
                                </div>
                            </div>)
                        })}
                    </div>
                </div>
            </section>
        </>
    )
}

let observerDedicatedView = observer(DedicatedView);
export default observerDedicatedView;
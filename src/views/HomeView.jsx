import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { apiTest } from "@/api/index.js";

function HomeView() {
    let [testData, setTestData] = useState(null);
    useEffect(() => {
        (async () => {
            let res = await apiTest.getJPH().catch((err) => console.log('error get data HomeView ', err));
            setTestData(res);
        })();
        return () => {
            setTestData(null);
        }
    }, []);
    return (
        <>
            <section>
                <div className="content">
                    <h1>home page</h1>
                    <br />
                    {!testData && <div>Loading ...</div>}
                    {testData && <div>{JSON.stringify(testData)}</div>}
                </div>
            </section>
        </>
    )
}

let observerHomeView = observer(HomeView);
export default observerHomeView;
import { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useLocation, useSearchParams, useParams, useRoutes, useNavigate } from "react-router-dom";
import useStore from "@/hooks/useStore.js";

import { apiDedicated } from "@/api/index.js";

function DedicatedTariffView() {
    const store = useStore();
    let urlParams = useParams();
    const navigate = useNavigate();
    let [data, setData] = useState(null);
    let [done, setDone] = useState(false);
    let [error, setError] = useState(null);
    let [payForYear, setPayForYear] = useState(false);
    let [dataBusInitial, setDataBusInitial] = useState([]);

    useEffect(() => {
        (async () => {
            let res = await apiDedicated.getDedicatedItem(urlParams.id).catch((err) => { console.log('error:::: ', err); setError(err?.message); setDone(true) });
            setDataBusInitial(structuredClone(res?.data?.bus));
            setData(structuredClone(res?.data));
            setDone(true);
        })();
        return () => {
            setData(null);
        }
    }, []);

    let totalPriceChassis = useMemo(
        () => {
            let totalPriceMonth = data?.container?.price;
            let totalPriceYear = payForYear ? (totalPriceMonth * .9) : totalPriceMonth;
            return {
                month: totalPriceMonth,
                total: Math.round(totalPriceYear * 100) / 100
            }
        },
        [data?.container?.price, payForYear]
    );
    let totalPriceCPU = useMemo(
        () => {
            let cpu = data?.cpu?.cpuCanBeInstall.find((el) => {
                return el.id == data.cpu.partId;
            })
            let totalPriceServerMonth = cpu && cpu?.price * data?.cpu?.cpuInstallNumber;
            let totalPriceServerYear = payForYear ? (totalPriceServerMonth * .9) : totalPriceServerMonth;
            return {
                month: totalPriceServerMonth,
                total: Math.round(totalPriceServerYear * 100) / 100
            }
        },
        [data?.cpu?.cpuInstallNumber, data?.cpu?.partId, payForYear]
    );
    let totalPriceRam = useMemo(
        () => {
            let totalPriceMonth = data?.ram?.part?.price * (data?.ram?.value / data?.ram?.min);
            let totalPriceYear = payForYear ? (totalPriceMonth * .9) : totalPriceMonth;
            return {
                month: totalPriceMonth,
                total: Math.round(totalPriceYear * 100) / 100
            }
        },
        [data?.ram?.value, payForYear]
    );

    function setCpuNumber(e) {
        setData({
            ...data,
            cpu: {
                ...data.cpu,
                cpuInstallNumber: e.target.value
            }
        })
    }
    function setCpuModel(e) {
        setData({
            ...data,
            cpu: {
                ...data.cpu,
                partId: +e.target.value
            }
        })
    }
    function setRam(e) {
        if (e.target.value < data.ram.required * data.ram.min) {
            e.target.value = data.ram.required * data.ram.min;
        }
        setData({
            ...data,
            ram: {
                ...data.ram,
                value: e.target.value
            }
        })
    }
    function checkAvailabilitySataDrives(drivesSlots = null, busSlots = null) {
        let basketsSum = data?.drives?.baskets != undefined && data.drives.baskets.reduce((acc, el) => {
            acc += el;
            return acc;
        }, 0);
        let drivesSlotsData = drivesSlots != null && drivesSlots.reduce((acc, el) => {
            acc.cellsOccup += el.occup_cells;
            if (el.type == 'SATA' && el.part_id != null) {
                acc.slotsOccup++;
            }
            return acc;
        }, { cellsOccup: 0, slotsOccup: 0 });
        let busSlotsData = busSlots != null && busSlots.reduce((acc, busSlot) => {
            busSlot.boards.forEach(board => {
                board.driveSlots.forEach((driveSlot) => {
                    acc.cellsOccup += driveSlot.occup_cells;
                    if (driveSlot.type == 'SATA' && driveSlot.part_id != null) {
                        acc.slotsOccup++;
                    }
                })
            });
            return acc;
        }, { cellsOccup: 0, slotsOccup: 0 });
        let slotsOccup = (drivesSlotsData.slotsOccup ?? 0);
        let checkMaxParts = data.drives.cells.max_parts >= (slotsOccup + 1);
        let cellsOccup = (drivesSlotsData.cellsOccup ?? 0) + (busSlotsData.cellsOccup ?? 0);
        let cellsFree = data.drives.cells.count - cellsOccup;

        let drives_slots = null;
        drivesSlots != null && (drives_slots = drivesSlots.map((slot, index) => {
            let canBeInstall = slot.canBeInstall;
            if (slot.type == 'SATA') {
                canBeInstall = canBeInstall.map((drive) => {
                    let available = true;

                    let increasCells = drive.class_desc.cells - slot.occup_cells;

                    if (data.drives.baskets != undefined) {

                        let diskInaccessibilityBaskets = (cellsOccup + increasCells) > basketsSum;

                        if (data?.drives?.baskets?.length > slotsOccup) {
                            if (checkMaxParts == false) {
                                if (slot.part_id != null) {
                                    diskInaccessibilityBaskets && (available = false);
                                } else {
                                    available = false;
                                }
                            } else {
                                diskInaccessibilityBaskets && (available = false);
                            }
                        } else if (data?.drives?.baskets?.length == slotsOccup) {
                            if (slot.part_id != null) {
                                diskInaccessibilityBaskets && (available = false);
                            } else {
                                available = false;
                            }

                        } else if (data?.drives?.baskets?.length < slotsOccup) {
                            console.error('checkAvailabilitySataDrives: error check available disk by baskets');
                        }

                    } else {
                        let diskInaccessibilityCells = increasCells > cellsFree;
                        if (data.drives.cells.count > cellsOccup) {
                            if (checkMaxParts == false) {
                                if (slot.part_id != null) {
                                    diskInaccessibilityCells && (available = false);
                                } else {
                                    available = false;
                                }
                            } else {
                                diskInaccessibilityCells && (available = false);
                            }
                        } else if (data.drives.cells.count == cellsOccup) {
                            if (slot.part_id != null) {
                                diskInaccessibilityCells && (available = false);
                            } else {
                                available = false;
                            }
                        } else if (data.drives.cells.count < cellsOccup) {
                            console.error('checkAvailabilitySataDrives: error check available disk by cells');
                        }
                    }
                    return {
                        ...drive,
                        available: available
                    };
                })
            }
            return {
                ...slot,
                canBeInstall: canBeInstall
            };
        }));
        let bus_slots = null;
        busSlots != null && (bus_slots = busSlots.map((busSlot) => {
            let boards = busSlot.boards.map(board => {
                let driveSlots = board.driveSlots.map((driveSlot) => {
                    let drives = driveSlot.drives;
                    if (driveSlot.type == 'SATA') {
                        drives = drives.map((drive) => {
                            let available = true;
                            let increasCells = drive.class_desc.cells - driveSlot.occup_cells;
                            if (data.drives.baskets != undefined) {
                                let diskInaccessibilityBaskets = (cellsOccup + increasCells) > basketsSum;
                                if (data?.drives?.baskets?.length > slotsOccup) {
                                    diskInaccessibilityBaskets && (available = false);
                                } else if (data?.drives?.baskets?.length == slotsOccup) {
                                    if (driveSlot.part_id != null) {
                                        diskInaccessibilityBaskets && (available = false);
                                    } else {
                                        available = false;
                                    }
                                } else if (data?.drives?.baskets?.length < slotsOccup) {
                                    console.error('checkAvailabilitySataDrives for BUS: error check available disk by baskets');
                                }
                            } else {
                                let diskInaccessibilityCells = increasCells > cellsFree;
                                if (data.drives.cells.count > cellsOccup) {
                                    if (checkMaxParts == false) {
                                        if (driveSlot.part_id != null) {
                                            diskInaccessibilityCells && (available = false);
                                        } else {
                                            available = false;
                                        }
                                    } else {
                                        diskInaccessibilityCells && (available = false);
                                    }
                                } else if (data.drives.cells.count == cellsOccup) {

                                    if (driveSlot.part_id != null) {
                                        diskInaccessibilityCells && (available = false);
                                    } else {
                                        available = false;
                                    }
                                } else if (data.drives.cells.count < cellsOccup) {
                                    console.error('checkAvailabilitySataDrives for BUS: error check available disk by cells');
                                }
                            }

                            return {
                                ...drive,
                                available: available
                            };
                        })
                    }
                    return {
                        ...driveSlot,
                        drives: drives
                    };
                })

                return {
                    ...board,
                    driveSlots: driveSlots
                };
            });

            return {
                ...busSlot,
                boards: boards
            };
        }));
        return { drives_slots, bus_slots }
    }
    function setDrives(idDrive, index, slotType) {
        let slots = data.drives.drivesSlots.map((slot, ind) => {
            if (ind == index) {
                if (idDrive == 'null') {
                    slot.part_id = null;
                    slot.price = 0;
                    slot.total_price = 0;
                    slot.total_price12 = 0;
                    slot.occup_cells = 0;
                } else {
                    let selectedDrive = slot.canBeInstall.find((drive) => {
                        return drive.id == idDrive;
                    })
                    if (selectedDrive == undefined) {
                        console.error('setDrives: can not find drive for DRIVES ', idDrive);
                    } else {
                        slot.part_id = +idDrive;
                        slot.price = selectedDrive.price;
                        slot.total_price = selectedDrive.price;
                        slot.total_price12 = Math.round((selectedDrive.price * .9) * 100) / 100;
                        slot.occup_cells = selectedDrive.class_desc.cells;
                    }
                }
            }
            return slot;
        })

        let busSlots = structuredClone(data?.bus?.slots) || null;
        let { drives_slots, bus_slots } = checkAvailabilitySataDrives(slots, busSlots);

        let newData = {
            ...data,
            drives: {
                ...data.drives,
                drivesSlots: drives_slots
            }
        }
        if (busSlots != null) {
            newData.bus = {
                ...data.bus,
                slots: bus_slots
            }
        }
        setData(newData);
    }
    function setBus(idBus, slotIndex) {
        let busSlotsClone = structuredClone(data.bus.slots);
        let busSlots = busSlotsClone.map((busSlot, ind) => {
            if (ind == slotIndex) {
                if (idBus == 'null') {
                    busSlot.part_id = null;
                    busSlot.price = 0;
                    busSlot.total_price = 0;
                    busSlot.total_price12 = 0;
                    busSlot.selectedBusIndex = null;
                } else {
                    let selectedBusIndex = busSlot.boards.findIndex((bus) => {
                        return bus.id == idBus;
                    });
                    let selectedBus = selectedBusIndex != undefined && busSlot.boards[selectedBusIndex];
                    if (selectedBus == false) {
                        console.error('setBus: can not find bus ', idBus);
                    } else {
                        busSlot.part_id = +idBus;
                        busSlot.price = selectedBus.price;
                        busSlot.total_price = selectedBus.price;
                        busSlot.total_price12 = Math.round((selectedBus.price * .9) * 100) / 100;
                        busSlot.selectedBusIndex = selectedBusIndex;
                    }
                }

                let slotBoards = structuredClone(busSlot.boards).map((board) => {
                    if (board.id != idBus) {
                        let dataBoardInitial = dataBusInitial.slots[slotIndex].boards.find((el) => el.id == board.id);
                        if (dataBoardInitial == undefined) {
                            console.error('setBus: can not find board in dataBusInitial ', board.id);
                        } else {
                            board.driveSlots = dataBoardInitial.driveSlots;
                        }
                    }
                    return board;
                });
                busSlot.boards = slotBoards;

            }

            return busSlot;
        })


        let drivesSlots = structuredClone(data?.drives?.drivesSlots) || null;
        let { drives_slots, bus_slots } = checkAvailabilitySataDrives(drivesSlots, busSlots);

        setData({
            ...data,
            bus: {
                ...data.bus,
                slots: bus_slots
            },
            drives: {
                ...data.drives,
                drivesSlots: drives_slots
            }
        })
    }
    function setBusDrive(idDrive, indexDriveSlot, indexBusSlot, indexBord) {
        let busSlots = structuredClone(data.bus.slots);
        let busSlot = busSlots[indexBusSlot];
        let boards = busSlot.boards;
        let board = boards[indexBord];
        let driveSlots = board.driveSlots;
        let driveSlot = driveSlots[indexDriveSlot];
        if (idDrive == 'null') {
            driveSlot.part_id = null;
            driveSlot.price = 0;
            driveSlot.total_price = 0;
            driveSlot.total_price12 = 0;
            driveSlot.occup_cells = 0;
        } else {
            let selectedDriveIndex = driveSlot.drives.findIndex((drive) => {
                return drive.id == idDrive;
            });
            let selectedDrive = selectedDriveIndex != undefined && driveSlot.drives[selectedDriveIndex];
            if (selectedDrive == undefined) {
                console.error("setBusDrive: can't find bus drive", idDrive);
            } else {
                driveSlot.part_id = +idDrive;
                driveSlot.price = selectedDrive.price;
                driveSlot.total_price = selectedDrive.price;
                driveSlot.total_price12 = Math.round((selectedDrive.price * .9) * 100) / 100;
                driveSlot.occup_cells = selectedDrive.class_desc.cells;
            }
        }

        let drivesSlots = structuredClone(data?.drives?.drivesSlots) || null;
        let { drives_slots, bus_slots } = checkAvailabilitySataDrives(drivesSlots, busSlots);

        setData({
            ...data,
            bus: {
                ...data.bus,
                slots: bus_slots
            },
            drives: {
                ...data.drives,
                drivesSlots: drives_slots
            }
        })
    }
    function setOs(id) {
        let soft = structuredClone(data.soft);
        soft.forEach((el) => {
            if (!el.for_os.includes(id)) {
                el.checked = false;
            }
        })
        setData({
            ...data,
            os: id,
            soft: [...soft]
        })
    }
    function setNumberIp(e) {
        e.target.value = e.target.value.replace(/\D/g, "");
        e.target.value = e.target.value.replace(/^0/g, "");
        if (e.target.value >= 101) {
            let replacer = e.target.value.match(/(.{1,3})/);
            e.target.value = e.target.value.replace(/(.{4,})/g, replacer[0]);
        }
        let qt = +e.target.value;
        let total_price = qt * +data.ip.price;
        total_price = Math.round(total_price * 100) / 100
        let total_price12 = qt * +data.ip.price12 * 12;
        total_price12 = Math.round(total_price12 * 100) / 100;
        setData({
            ...data,
            ip: {
                ...data.ip,
                qt,
                total_price,
                total_price12
            }
        })
    }
    function setSoft(e, index) {
        let soft = structuredClone(data.soft);
        soft[index].checked = e.target.checked;
        setData({
            ...data,
            soft: [...soft]
        })
    }

    function totalPriceServer() {
        let res = 0;
        if (data.server.class != 'container') {
            let totalServerPriceMonth = data.server.price;
            let totalServerPriceYear = payForYear ? (totalServerPriceMonth * .9) : totalServerPriceMonth;
            let totalServerPrice = {
                month: totalPriceMonth,
                total: Math.round(totalServerPriceYear * 100) / 100
            }
            res += totalServerPrice.total;
        } else if (data.server.class == 'container') {
            res += totalPriceChassis.total;
            if (data?.cpu != undefined) {
                res += totalPriceCPU.total;

            }
            res += totalPriceRam.total;

            let drivesPrice = data.drives.drivesSlots.reduce((acc, slot) => {
                if (slot.part_id != null) {
                    acc += payForYear ? slot.total_price12 : slot.total_price;
                }
                return acc;
            }, 0);
            res += drivesPrice;

            if (data?.bus?.slots != undefined) {
                let busPrice = data.bus?.slots.reduce((acc, busSlot) => {
                    if (busSlot.part_id != null) {
                        acc += payForYear ? busSlot.total_price12 : busSlot.total_price;
                        let installedBus = busSlot.boards.find((board) => {
                            return board.id == busSlot.part_id;
                        })
                        if (installedBus == undefined) {
                            console.error('totalPriceServer ', 'error in busPrice');
                            setError('totalPriceServer: error in busPrice');
                        } else {
                            installedBus.driveSlots.forEach((driveSlot) => {
                                if (driveSlot.part_id != null) {
                                    acc += payForYear ? driveSlot.total_price12 : driveSlot.total_price;
                                }
                            })
                        }
                    }
                    return acc;
                }, 0);
                res += busPrice;
            }

        }
        return Math.round(res * 100) / 100;
    }
    function totalOrderPrice() {
        let res = totalPriceServer();
        res = payForYear ? res * 12 : res;
        res += payForYear ? data.ip.total_price12 : data.ip.total_price;

        res += data.soft.reduce((acc, el) => {
            if (el.checked === true) {
                let price = payForYear ? el.price12m * 12 : el.price;
                acc += price;
            }
            return acc;
        }, 0);

        return Math.round(res * 100) / 100;
    }
    function addToCart(e) {
        e.target.disabled = true;
        let order = {
            ...structuredClone(data),
            payForYear: payForYear,
            totalPriceServer: totalPriceServer(),
            totalOrderPrice: totalOrderPrice()
        }
        let cart = [];
        if (localStorage.getItem('cart') != null) {
            cart = JSON.parse(localStorage.getItem('cart'))
        }
        cart.push(structuredClone(order));
        localStorage.setItem('cart', JSON.stringify(cart));
        store.cart.setNumberItemsCart();
        navigate('/cart');
    }

    return (
        <>
            <section className="dedicated-tariff">
                <div className="content">
                    {!done && <div>Loading ...</div>}
                    {error != null && <div>{JSON.stringify(error)}</div>}
                    {(done && data == null) && <div>404. Page not found.</div>}
                </div>
                {error == null && data && <div className="content">
                    <h1 className="dedicated-tariff__title">Dedicated Server Configuration: <span>{data.server.name} ({data.server.dc_name})</span></h1>
                    <div className="dedicated-tariff__content">
                        <div className="dedicated-tariff__data">

                            <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    Chassis:
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    <span>{data.server.description} </span>
                                    {payForYear && <span className="dedicated-tariff__old-price">($ {totalPriceChassis.month} / month )</span>}
                                    <span>($ {totalPriceChassis.total} / month ) </span>
                                </div>
                            </div>

                            {data.cpu && <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    CPU:
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    <select onChange={setCpuModel}>
                                        {data.cpu.cpuCanBeInstall && data.cpu.cpuCanBeInstall.map((el) => {
                                            return (<option value={el.id} key={el.id}>{el.description}</option>)
                                        })}
                                    </select>
                                    <p>number of CPUs</p>
                                    <p>X {data.cpu.cpuInstallNumber}</p>
                                    <input type="range"
                                        min={data.cpu.cpuMinNumber}
                                        max={data.cpu.cpuMaxNumber}
                                        value={data.cpu.cpuInstallNumber}
                                        step="1"
                                        onInput={setCpuNumber}
                                    />
                                    {payForYear && <p className="dedicated-tariff__old-price">($ {totalPriceCPU.month} / month )</p>}
                                    <p>($ {totalPriceCPU.total} / month )</p>
                                </div>
                            </div>}

                            <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    RAM:
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    <p>RAM {data?.ram?.value} {data?.ram?.part?.class_desc?.params?.units}</p>
                                    <input
                                        type="range"
                                        min={data?.ram?.min}
                                        max={data?.ram?.max}
                                        value={data?.ram?.value}
                                        step={data?.ram?.min}
                                        onInput={setRam} />
                                    {payForYear && <p className="dedicated-tariff__old-price">($ {totalPriceRam.month} / month )</p>}
                                    <p>($ {totalPriceRam.total} / month )</p>
                                </div>
                            </div>

                            {data.drives && <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    DISKS:
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    {data.drives.drivesSlots.map((slot, index) => {
                                        return (
                                            <div className="dedicated-tariff__disk-wrap" key={slot.key}>
                                                <p>{slot.occup_cells} ::{slot.type == 'M.2' ? 'NVMe' : slot.type}:</p>
                                                <select defaultValue={slot.part_id} onChange={(e) => setDrives(e.target.value, index, slot.type)}>
                                                    <option value="null">-</option>
                                                    {slot.canBeInstall.map((item) => {
                                                        return (
                                                            item.available && <option value={item.id} key={item.id}>{item.description}</option>
                                                        )
                                                    })}
                                                </select>
                                                {slot.total_price > 0 && <div>
                                                    {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>(${slot.total_price} / month )</p>}
                                                    {payForYear && <p>${slot.total_price12} / month </p>}
                                                </div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>}

                            {data.bus && <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    Extension board:
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    {data.bus.slots && data.bus.slots.map((slot, indexBusSlot) => {
                                        return (
                                            <div className="dedicated-tariff__ext-board" key={slot.key}>
                                                {slot.boards &&
                                                    <div>
                                                        <select defaultValue={slot.part_id} onChange={(e) => setBus(e.target.value, indexBusSlot)}>
                                                            <option value="null">-</option>
                                                            {slot.boards.map((board) => {
                                                                return (
                                                                    <option value={board.id} key={board.id}>{board.description}</option>
                                                                )
                                                            })}
                                                        </select>
                                                        {slot.total_price > 0 && <div>
                                                            {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>(${slot.total_price} / month )</p>}
                                                            {payForYear && <p>${slot.total_price12} / month </p>}
                                                        </div>}
                                                    </div>
                                                }
                                                {slot.part_id != null &&
                                                    slot.boards[slot.selectedBusIndex].driveSlots.map((driveSlot, indexDriveSlot) => {
                                                        return (
                                                            <div className="dedicated-tariff__ext-board-disk" key={driveSlot.key}>
                                                                <p>{driveSlot.type}:</p>
                                                                <select
                                                                    defaultValue={driveSlot.part_id}
                                                                    onChange={(e) => setBusDrive(e.target.value, indexDriveSlot, indexBusSlot, slot.selectedBusIndex)}>
                                                                    <option value="null">-</option>
                                                                    {driveSlot.drives.map((drive) => {
                                                                        return (
                                                                            drive.available && <option value={drive.id} key={drive.id}>{drive.description}</option>
                                                                        )
                                                                    })}
                                                                </select>
                                                                {driveSlot.total_price > 0 && <div>
                                                                    {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>(${driveSlot.total_price} / month )</p>}
                                                                    {payForYear && <p>${driveSlot.total_price12} / month </p>}
                                                                </div>}
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>}

                            <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    Port
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    {data?.server?.port}
                                </div>
                            </div>

                            <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    Bandwidth
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    {data.server.traffic}
                                </div>
                            </div>

                            <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    Setup time
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    {data.server.comment}
                                </div>
                            </div>

                            <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    Location
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    {data.server.dc_name}
                                </div>
                            </div>

                            <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    Operation system
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    <select defaultValue={data.os} onChange={(e) => setOs(e.target.value)}>
                                        <option value="-">(choose)</option>
                                        {data.operatingSystems.map((el) => {
                                            return (
                                                <option value={el.value} key={el.value}>{el.text}</option>
                                            )
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="dedicated-tariff__data-item">
                                <div className="dedicated-tariff__data-name">
                                    Extra IP
                                </div>
                                <div className="dedicated-tariff__data-value">
                                    <input type="text" defaultValue="0" onInput={setNumberIp}></input>
                                    {data.ip.total_price > 0 && <div>
                                        {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>(${data.ip.price} / month )</p>}
                                        {payForYear && <p>${data.ip.price12} / month </p>}
                                    </div>}
                                </div>
                            </div>

                            <div className="dedicated-tariff__software">
                                <h6 className="dedicated-tariff__software-title">Software:</h6>
                                {
                                    data.soft.map((el, index) => {
                                        return (
                                            <div className="dedicated-tariff__software-item" key={el.id}>
                                                <div className="dedicated-tariff__software-action">
                                                    <input
                                                        type="checkbox"
                                                        disabled={!el.for_os.includes(data.os)}
                                                        checked={el.checked}
                                                        onChange={(e) => setSoft(e, index)}
                                                    >
                                                    </input>
                                                </div>
                                                <div className="dedicated-tariff__software-name">
                                                    {el.name}, {el.type}
                                                </div>
                                                <div className="dedicated-tariff__software-price">
                                                    {el.price == 0 && <div>{el.price_title}</div>}
                                                    {el.price != 0 && <div>
                                                        {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>${el.price} / month </p>}
                                                        {payForYear && <p>${el.price12m} / month </p>}
                                                    </div>}
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>

                        </div>
                        <div className="dedicated-tariff__order">
                            <div className="dedicated-tariff__order-inner">
                                <h5 className="dedicated-tariff__order-title">Order</h5>
                                <h6 className="dedicated-tariff__order-name">{data.server.name} ({data.server.dc_name})</h6>
                                <div className="dedicated-tariff__order-group">
                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            Chassis:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            <div>{data.server.description}</div>
                                            <div className="dedicated-tariff__order-item-price">
                                                {payForYear && <div className="dedicated-tariff__old-price">($ {totalPriceChassis.month} / month )</div>}
                                                <div>($ {totalPriceChassis.total} / month ) </div>
                                            </div>
                                        </div>
                                    </div>

                                    {data?.cpu && (<div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            CPU:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            <div>{data.cpu.cpuInstallNumber}x {
                                                data.cpu.cpuCanBeInstall.find((el) => { return el.id == data.cpu.partId }).name
                                            }</div>
                                            <div className="dedicated-tariff__order-item-price">
                                                {payForYear && <p className="dedicated-tariff__old-price">($ {totalPriceCPU.month} / month )</p>}
                                                <p>($ {totalPriceCPU.total} / month )</p>
                                            </div>
                                        </div>
                                    </div>)}

                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            RAM:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            <p>{data?.ram?.value} {data?.ram?.part?.class_desc?.params?.units}</p>
                                            <div className="dedicated-tariff__order-item-price">
                                                {payForYear && <p className="dedicated-tariff__old-price">($ {totalPriceRam.month} / month )</p>}
                                                <p>($ {totalPriceRam.total} / month )</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            DISKS:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            {data.drives.drivesSlots && data.drives.drivesSlots.map((slot, index) => {
                                                return (
                                                    <div key={slot.key} style={{ marginBottom: '4px' }}>
                                                        <div>
                                                            {
                                                                slot.canBeInstall.find((item) => {
                                                                    return item.id == slot.part_id;
                                                                })?.description
                                                            }
                                                        </div>
                                                        <div className="dedicated-tariff__order-item-price" style={{ paddingLeft: '6px' }}>
                                                            {slot.total_price > 0 && <div>
                                                                {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>(${slot.total_price} / month )</p>}
                                                                {payForYear && <p>${slot.total_price12} / month </p>}
                                                            </div>}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {data.bus && (<div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            Extension board:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            {!data.bus.slots.some((el) => el.part_id != null) && <div>-</div>}
                                            <div>
                                                {data.bus.slots.map((slot, indexBusSlot) => {
                                                    return (
                                                        <div className="dedicated-tariff__order-ext-board" key={slot.key}>
                                                            {slot.part_id != null &&
                                                                (<div>
                                                                    <div>
                                                                        {slot.boards.find((board) => {
                                                                            return board.id == slot.part_id;
                                                                        })?.description}
                                                                    </div>
                                                                    <div className="dedicated-tariff__order-item-price" style={{ paddingLeft: '6px' }}>
                                                                        {<div>
                                                                            {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>(${slot.total_price} / month )</p>}
                                                                            {payForYear && <p>${slot.total_price12} / month </p>}
                                                                        </div>}
                                                                    </div>
                                                                </div>)
                                                            }
                                                            {slot.part_id != null &&
                                                                slot.boards[slot.selectedBusIndex].driveSlots.map((driveSlot) => {
                                                                    return (
                                                                        <div className="dedicated-tariff__order-ext-board-disks" style={{ paddingLeft: '15px' }} key={driveSlot.key}>

                                                                            {driveSlot.part_id == null && <p>-</p>}
                                                                            <p>
                                                                                {driveSlot.drives.find((drive) => {
                                                                                    return drive.id == driveSlot.part_id;

                                                                                })?.description}
                                                                            </p>
                                                                            <div className="dedicated-tariff__order-item-price" style={{ paddingLeft: '6px' }}>
                                                                                {driveSlot.price > 0 && <div>
                                                                                    {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>(${driveSlot.total_price} / month )</p>}
                                                                                    {payForYear && <p>${driveSlot.total_price12} / month </p>}
                                                                                </div>}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>)}

                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            Port:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            {data?.server?.port}
                                        </div>
                                    </div>

                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            Bandwidth:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            {data.server.traffic}
                                        </div>
                                    </div>

                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            Setup time:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            {data.server.comment}
                                        </div>
                                    </div>

                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            Location:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            {data.server.dc_name}
                                        </div>
                                    </div>

                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            Operation system:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            {data.os}
                                        </div>
                                    </div>

                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            server price:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            <span className="dedicated-tariff__order-price">${totalPriceServer()}</span> / month
                                        </div>
                                    </div>
                                </div>

                                {data.ip.qt > 0 && (<div className="dedicated-tariff__order-group">
                                    <div className="dedicated-tariff__order-item">
                                        <div className="dedicated-tariff__order-item-name">
                                            Extra IP:
                                        </div>
                                        <div className="dedicated-tariff__order-item-value">
                                            <div>qt. {data.ip.qt}  pcs.</div>
                                            {<div className="dedicated-tariff__order-item-price" style={{ paddingLeft: '6px' }}>
                                                {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>(${data.ip.price} / month )</p>}
                                                {payForYear && <p>${data.ip.price12} / month </p>}
                                            </div>}
                                        </div>
                                    </div>
                                </div>)}

                                {
                                    data.soft.map((el) => {
                                        return (
                                            <div key={el.id}>
                                                {el.checked === true && <div className="dedicated-tariff__order-group"  >
                                                    <div className="dedicated-tariff__order-item">
                                                        <div className="dedicated-tariff__order-item-name">
                                                            {el.name}, {el.type}
                                                        </div>
                                                        <div className="dedicated-tariff__order-item-value">
                                                            <div className="dedicated-tariff__software-price">
                                                                {el.price == 0 && <div>{el.price_title}</div>}
                                                                {el.price != 0 && <div>
                                                                    {<p className={payForYear ? "dedicated-tariff__old-price" : ''}>${el.price} / month </p>}
                                                                    {payForYear && <p>${el.price12m} / month </p>}
                                                                </div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>}
                                            </div>
                                        )
                                    })
                                }

                                <div className="dedicated-tariff__order-item">
                                    <div className="dedicated-tariff__order-item-name">
                                        Total:
                                    </div>
                                    <div className="dedicated-tariff__order-item-value">
                                        <span className="dedicated-tariff__order-price">${totalOrderPrice()}</span>
                                    </div>
                                </div>

                                <div>
                                    <label>
                                        <input type="checkbox" checked={payForYear} onChange={(e) => setPayForYear(e.target.checked)} />
                                        <span> payment for the year</span>
                                    </label>
                                </div>

                                <button className="dedicated-tariff__order-btn" type="button" onClick={addToCart}>add to cart</button>
                            </div>
                        </div>
                    </div>
                </div>}
            </section>
        </>
    )
}

let observerDedicatedTariffView = observer(DedicatedTariffView);
export default observerDedicatedTariffView;
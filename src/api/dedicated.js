// import http from '@/api/http.js';

import dedicatedList from '@/assets/data-files/dedicated/dedicated-generated.json';
import containers from '@/assets/data-files/dedicated/containers.json';
import operatingSystems from '@/assets/data-files/dedicated/oses.json';
import soft from '@/assets/data-files/dedicated/dedicated_soft-generated.json';

export async function getDedicatedList() {
    // await sleep(1000);
    return dedicatedList;
}

export async function getDedicatedItem(id) {
    let ip_price = 2;
    let ip_price12 = Math.round((ip_price * .9) * 100) / 100;
    soft.forEach((el) => {
        el.checked = false;
    });
    // await sleep(1000);
    let data = null;
    let error = null;
    let res = {
        uid: self.crypto.randomUUID(),
        server: {},
        container: {},
        // cpu: {},
        ram: {},
        drives: {},
        // bus: {},
        os: '-',
        operatingSystems: structuredClone(operatingSystems),
        ip: {
            price: ip_price,
            price12: ip_price12,
            currency: '$',
            qt: 0,
            total_price: 0,
            total_price12: 0
        },
        soft: structuredClone(soft)
    }
    let datacenters = {
        'ua': 'Ukraine',
        'nl': 'Netherlands',
        'us': 'USA'
    }
    let tariff = dedicatedList.find((item) => item.id == id);
    if (tariff == undefined) {
        throw new Error('tariff not found!');
    }

    //START: server  
    let dcName = datacenters[tariff.datacenters[0]];
    tariff.dc_name = dcName ?? datacenters.ua;
    res.server = structuredClone(tariff);
    //END: server  

    let container = containers.find((item) => item.id == tariff.id);
    if (container != undefined) {
        //START: container   
        res.container.price = container.price;
        //END: container

        // START: cpu
        let cpuInterfaces = container?.class_desc?.categories?.CPU?.interfaces;
        if (cpuInterfaces != undefined) {
            let cpuMaxNumber = cpuInterfaces.length;
            let cpuInstallNumber = cpuInterfaces.reduce((acc, item, index) => {
                if (item.part_id != null) {
                    ++acc;
                }
                return acc;
            }, 0);
            let cpuCanBeInstall = cpuInterfaces[0].params.model.reduce((acc, nameModel, index) => {
                containers.forEach(el => {
                    let isPart = el.class == 'part';
                    let isCPU = isPart && el.class_desc.category == 'CPU';
                    let matchingModel = isPart && isCPU && el.class_desc.params.model == nameModel;
                    let matchingInterfaceType = isPart && isCPU && el.class_desc.interface_type == cpuInterfaces[0].type;
                    let matchingAllParams = isPart && isCPU && matchingModel && matchingInterfaceType;
                    if (matchingAllParams) {
                        acc.push(el);
                    }
                });
                return acc;
            }, []);

            let cpuPartId = null;
            let cpuInterfaceWithPart = cpuInterfaces.find((el) => {
                return el.part_id != null;
            });
            if (cpuInterfaceWithPart == 'undefined') {
                throw new Error('cpu: cpu not installed!');
            } else {
                let cpuPartInstalled = cpuCanBeInstall.find((item) => {
                    return item.id == cpuInterfaceWithPart.part_id;
                });
                if (cpuPartInstalled == undefined) {
                    throw new Error('cpu: different processors installed!');
                } else {
                    cpuPartId = cpuPartInstalled.id;
                }
            }

            let cpu = {
                cpuMaxNumber,
                cpuMinNumber: cpuInstallNumber,
                cpuInstallNumber,
                cpuCanBeInstall: structuredClone(cpuCanBeInstall),
                partId: cpuPartId
            }
            cpu && (res.cpu = cpu);
        }
        //END: cpu   

        //SART: RAM  ------------------             
        let ramInterfaces = container?.class_desc?.categories?.RAM?.interfaces;
        let ramRequired = ramInterfaces && ramInterfaces.reduce((accumulator, currentValue, index) => {
            if (currentValue.required == 1) {
                ++accumulator;
            }
            return accumulator;
        }, 0);
        let ramInstalled = ramInterfaces && ramInterfaces.reduce((accum, currentValue, index) => {
            if (currentValue.part_id != null) {
                ++accum;
            }
            return accum;
        }, 0);
        let ramPartInstalled = ramInterfaces && ramInterfaces.find((item) => {
            return item.part_id != null;
        });
        let ramPart = ramRequired && containers.find((item) => {
            return item.id == ramPartInstalled.part_id;
        });
        let ram = ramPart && ramInterfaces && {
            min: ramPart.class_desc.params.capacity,
            max: ramPart.class_desc.params.capacity * ramInterfaces.length,
            value: ramPart.class_desc.params.capacity * ramInstalled,
            required: ramRequired,
            part: ramPart
        }
        ram && (res.ram = ram);
        //END: RAM ------------------

        //START: DRIVES -------------
        let drivesInterfaces = container?.class_desc?.categories?.DRIVES?.interfaces;
        let driveCells = container?.class_desc?.cells;
        let drivesBaskets = container?.class_desc?.baskets;

        Array.isArray(drivesInterfaces) && drivesInterfaces.map((slot) => {
            slot.price = 0;
            slot.total_price = 0;
            slot.total_price12 = 0;
            slot.occup_cells = 0;
            let canBeInstall = containers.reduce((acc, el, index) => {
                let isPart = el.class == 'part';
                let matchType = isPart && el.class_desc.interface_type == slot.type;
                let mathCategory = isPart && el.class_desc.category == "DRIVES";
                let tempDCs = [...el.dcs, ...container.dcs];
                let unicDCs = new Set(tempDCs);
                let matchDcs = isPart && tempDCs.length > unicDCs.size;
                if (isPart && matchType && mathCategory && matchDcs) {
                    el.available = true;
                    acc.push(el);
                }
                return acc;
            }, []);
            if (slot.part_id != null) {
                let slotPart = canBeInstall.find((el) => {
                    return el.id == slot.part_id;
                })
                if (slotPart == undefined) {
                    throw new Error('drives: slot part_id not found in canBeInstall!');
                } else {
                    slot.price = slotPart.price;
                    slot.total_price = slotPart.price;
                    slot.total_price12 = Math.round((slotPart.price * .9) * 100) / 100;
                    slot.occup_cells = slotPart.class_desc.cells;
                }
            }
            slot.key = self.crypto.randomUUID();
            slot.canBeInstall = structuredClone(canBeInstall);
        })

        let drives = {
            cells: driveCells,
            baskets: drivesBaskets,
            drivesSlots: drivesInterfaces
        }
        res.drives = drives;
        //END: DRIVES ---------------

        //START: BUS 
        let busInterfaces = structuredClone(container?.class_desc?.categories?.BUS?.interfaces);

        let busSlotsType = [
            {
                part_id: null,
                boards: [
                    {
                        driveSlots: [
                            {
                                part_id: null,
                                drives: [
                                    {

                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        let busSlots = Array.isArray(busInterfaces) && busInterfaces.length > 0 && busInterfaces.map((slot) => {
            slot.price = 0;
            slot.total_price = 0;
            slot.total_price12 = 0;
            slot.selectedBusIndex = null;
            let boards = containers.reduce((acc, el) => {
                let isPart = el.class == 'part';
                let matchType = isPart && el.class_desc.interface_type == slot.type;
                let matchCategory = isPart && el.class_desc.category == "BUS";
                let tempDCs = [...el.dcs, ...container.dcs];
                let unicDCs = new Set(tempDCs);
                let matchDcs = isPart && tempDCs.length > unicDCs.size;
                let matchCapasity = isPart && slot.params.capacity.some((item) => item == el.class_desc.params.capacity);
                let mathSize = isPart && slot.params.size.some((item) => item == el.class_desc.params.size);
                if (isPart && matchType && matchCategory && matchDcs && matchCapasity && mathSize) {
                    acc.push(el);
                }
                return acc;
            }, []);
            if (slot.part_id != null) {
                let slotPartIndex = boards.findIndex((el) => {
                    return el.id == slot.part_id;
                });
                let slotPart = slotPartIndex != undefined && boards[slotPartIndex];
                if (slotPart == undefined) {
                    throw new Error('BUS slot: part_id board not found in boards!');
                } else {
                    slot.price = slotPart.price;
                    slot.total_price = slotPart.price;
                    slot.total_price12 = Math.round((slotPart.price * .9) * 100) / 100;
                    slot.selectedBusIndex = slotPartIndex;
                }
            }
            slot.key = self.crypto.randomUUID();
            slot.boards = structuredClone(boards);
            return slot;
        })

        Array.isArray(busSlots) && busSlots.length > 0 && busSlots.forEach((slotBus) => {
            slotBus.boards.forEach((bus) => {
                let driveSlots = bus.class_desc.extend.DRIVES.interfaces.map((busDrivesInterface) => {
                    busDrivesInterface.price = 0;
                    busDrivesInterface.total_price = 0;
                    busDrivesInterface.total_price12 = 0;
                    busDrivesInterface.occup_cells = 0;
                    let drives = containers.reduce((acc, el, index) => {
                        let isPart = el.class == 'part';
                        let matchType = isPart && el.class_desc.interface_type == busDrivesInterface.type;
                        let mathCategory = isPart && el.class_desc.category == "DRIVES";
                        let tempDCs = [...el.dcs, ...container.dcs];
                        let unicDCs = new Set(tempDCs);
                        let matchDcs = isPart && tempDCs.length > unicDCs.size;
                        if (isPart && matchType && mathCategory && matchDcs) {
                            el.available = true;
                            acc.push(el);
                        }
                        return acc;
                    }, []);
                    if (busDrivesInterface.part_id != null) {
                        let slotPart = drives.find((el) => {
                            return el.id == busDrivesInterface.part_id;
                        })
                        if (slotPart == undefined) {
                            throw new Error('bus drives: slot part_id not found in drives!');
                        } else {
                            busDrivesInterface.price = slotPart.price;
                            busDrivesInterface.total_price = slotPart.price;
                            busDrivesInterface.total_price12 = Math.round((slotPart.price * .9) * 100) / 100;
                            busDrivesInterface.occup_cells = slotPart.class_desc.cells;
                        }
                    }
                    busDrivesInterface.key = self.crypto.randomUUID();
                    busDrivesInterface.drives = structuredClone(drives);
                    return busDrivesInterface;
                });
                bus.driveSlots = structuredClone(driveSlots);
            })
        })

        let bus = {
            slots: busSlots || null
        };

        busSlots && (res.bus = bus);
        //END: BUS

    }

    data = structuredClone(res);
    return { data, error };
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
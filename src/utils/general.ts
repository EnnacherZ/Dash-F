export const wait = async (time:number) => await new Promise ((resolve)=>setTimeout(resolve, time))

export const hideInfos = (infos: unknown, range: number): string => {
    if (!infos || typeof infos !== 'string') {
        return "Not found";
    }

    if (range >= infos.length) {
        return "*".repeat(infos.length);
    }

    const visiblePart = infos.slice(0, infos.length - range);
    const hiddenPart = "*".repeat(5);
    return visiblePart + hiddenPart;
};

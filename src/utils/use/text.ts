export const singularize = (name: string) => {
    if (name.endsWith("ies")) return name.slice(0, -3) + "y";
    if (name.endsWith("es")) {
        const base = name.slice(0, -2);
        if (base.endsWith("s") || base.endsWith("x") || base.endsWith("z") || base.endsWith("ch") || base.endsWith("sh")) {
            return base;
        }
    }
    if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
    return name;
}


export const isSingluar = (name: string) => {
    return name === singularize(name);
}

export const pluralize = (name: string) => {
    if (name.endsWith("y") && !/[aeiou]y$/i.test(name)) return name.slice(0, -1) + "ies";
    if (name.endsWith("s") || name.endsWith("x") || name.endsWith("z") || name.endsWith("ch") || name.endsWith("sh")) {
        return name + "es";
    }
    return name + "s";
}
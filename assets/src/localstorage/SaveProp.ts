
interface ISavePropItem {
    propertyKey: string,
    defaultValue: any,
    value?: any
}

export class SaveProp {

    private static _params: Map<any, ISavePropItem[]> = new Map();

    static Name = 'Arrow';

    static decorator(defaultValue: any) {
        const fn: PropertyDecorator = (target, propertyKey) => {
            let item: ISavePropItem = {
                propertyKey: String(propertyKey),
                defaultValue: defaultValue
            }
            let key = target.constructor;
            let arr = this._params.get(key) ?? this._params.set(key, []).get(key);
            arr.push(item);
        }
        return fn;
    }

    static initObject(target: Object, tag?: string) {
        let key = target.constructor;
        let arr = this._params.get(key);
        if (!arr) return;
        let classname = target.constructor.name;
        for (const item of arr) {
            let { propertyKey, defaultValue } = item;

            let keyParams = [this.Name, classname];
            !!tag && keyParams.push(tag);
            keyParams.push(propertyKey);
            const key = keyParams.join('_');
            item.value = SaveProp._getItem(key, defaultValue);
            Reflect.defineProperty(target, propertyKey, {
                set(v) {
                    SaveProp._setItem(key, v);
                    item.value = v;
                },
                get() {
                    return item.value;
                },
            });
        }
    }

    static removeObject(target: Object, tag?: string) {
        let classname = target.constructor.name;
        let keyParams = [this.Name, classname];
        !!tag && keyParams.push(tag);
        const keyHead = keyParams.join('_');
        let keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(keyHead)) {
                localStorage.removeItem(key);
            }
        }
    }

    private static _setItem(key: string, value: any) {
        let json = JSON.stringify({ value });
        localStorage.setItem(key, json);
    }

    private static _getItem(key: string, defaultValue: any) {
        let json = localStorage.getItem(key);
        let result = (!json || json.length === 0) ? null : JSON.parse(json)?.value;
        return result ?? defaultValue;
    }
}

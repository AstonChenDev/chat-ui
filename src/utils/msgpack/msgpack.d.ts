declare const msgpack: {
    pack(data: any): Uint8Array;
    unpack(data: string): any;
};

export default msgpack;

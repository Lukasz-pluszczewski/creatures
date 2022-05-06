export type Brand<TBase, TBrand extends string> = TBase & { _type: TBrand };

export type FixedLengthNumber<TBitLength extends number> = number & { bitLength: TBitLength };

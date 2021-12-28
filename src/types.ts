export enum REGIONS {
  'US_EAST_COAST' = 0x00,
  'US_WEST_COAST' = 0x01,
  'SOUTH_AMERICA' = 0x02,
  'EUROPE' = 0x03,
  'ASIA' = 0x04,
  'AUSTRALIA' = 0x05,
  'MIDDLE_EAST' = 0x06,
  'AFRICA' = 0x07,
  'ALL' = 0xFF
};

export interface Filters {
  nor?: Filters;
  nand?: Filters;
  dedicated?: 1;
  secure?: 1;
  gamedir?: string;
  map?: string;
  linux?: 1;
  password?: 0;
  empty?: 1;
  full?: 1;
  proxy?: 1;
  appid?: number;
  napp?: number;
  noplayers?: 1;
  white?: 1;
  gametype?: string[];
  gamedata?: string[];
  gamedataor?: string[];
  name_match?: string;
  version_match?: string;
  collapse_addr_hash?: 1;
  gameaddr?: string;
}

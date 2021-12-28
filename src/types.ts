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
  nor?: string;
  nand?: string;
  dedicated?: boolean;
  secure?: boolean;
  gamedir?: string;
  map?: string;
  linux?: boolean;
  password?: boolean;
  empty?: boolean;
  full?: boolean;
  proxy?: boolean;
  appid?: number;
  napp?: number;
  noplayers?: boolean;
  white?: boolean;
  gametype?: string[];
  gamedata?: string[];
  gamedataor?: string[];
  name_match?: string;
  version_match?: string;
  collapse_addr_hash?: boolean;
  gameaddr?: string;
}

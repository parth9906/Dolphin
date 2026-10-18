
export interface Enterprise {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Region {
  id: string;
  enterpriseId: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Cluster {
  id: string;
  regionId: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Institution {
  id: string;
  clusterId: string;
  code: string;
  name: string;
  institutionType: string;
  active: boolean;
}

export interface Campus {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  address: string | null;
  active: boolean;
}

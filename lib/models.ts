export interface ITree {
    _id: {
        $oid: string
    },
    value: number,
    createdAt: {
        $date: string
    },
    style: string,
    variant: string,
    projectId: number
}

export interface IQueryTree {
    _id: string,
    value?: number,
    createdAt?: Date,
    style?: string,
    variant?: string,
    projectId?: number
}

export type TreeQuery = {
    limit: number
    offset: number
    select: string
    sort?: Sort
    filters: Filter[]
}

export type FilterLHS = "eq" | "lt" | "lte" | "gt" | "gte" | "rng"

export interface Filter {
    property: keyof ITree
    value: string
    lhs?: FilterLHS
}

export interface Sort {
    property: keyof ITree
    direction: "asc" | "desc"
}

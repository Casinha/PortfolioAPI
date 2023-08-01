import { NextFunction, Request, Response } from "express"
import { Filter, FilterLHS, IQueryTree, ITree, Sort, TreeQuery } from "./models"

export const defaultSelect = "value,createdAt,style,variant,projectId"

//Parses the query string and converts the values to the correct type
export const parseQuery = (req: Request, res: Response, next: NextFunction) => {
    const query: TreeQuery = {
        limit: 1000,
        offset: 0,
        select: defaultSelect,
        filters: []
    }

    for (let prop in req.query) {
        switch (prop) {
            case "limit":
                query.limit = parseInt(<string>req.query[prop])
                break
            case "offset":
                query.offset = parseInt(<string>req.query[prop])
                break
            case "select":
                query.select = <string>req.query[prop]
                break
            case "sort":
                const sortSplit = (<string>req.query[prop]).split(":")
                query.sort = {
                    direction: (sortSplit[1]?.toLowerCase() ?? "asc") === "asc" ? "asc" : "desc",
                    property: sortSplit[0]
                } as Sort
                break
            case "_id":
            case "value":
            case "createdAt":
            case "style":
            case "variant":
            case "projectId":
                const filterDetails = /(\[(lt|lte|gt|gte|rng|eq)\])?(.*)/.exec(<string>req.query[prop])
                if (!filterDetails?.length) break
                query.filters.push({
                    property: prop,
                    lhs: filterDetails[2] as FilterLHS,
                    value: filterDetails[3]
                })
                break
        }
    }

    res.locals.query = query
    return next()
}

/**
 * @description Checks a record against the filter provided
 */
const testFilter = (tree: ITree, filter: Filter): boolean => {
    //If no LHS is provided, the filter is invalid and should be ignored
    if (!filter.lhs) return true

    //Type-safe method that tests the LHS of the filter against the given test value
    const testLhs: Record<FilterLHS, (treeValue: any, testValue: any) => boolean> = {
        eq: (treeValue: any, testValue: any) => treeValue === testValue,
        gt: (treeValue: any, testValue: any) => treeValue > testValue,
        gte: (treeValue: any, testValue: any) => treeValue >= testValue,
        lt: (treeValue: any, testValue: any) => treeValue < testValue,
        lte: (treeValue: any, testValue: any) => treeValue <= testValue,
        rng: (treeValue: any, testValue: any) => {
            const [start, end] = testValue.split(";")
            if (isDate(treeValue)) {
                return new Date(start) <= treeValue && new Date(end) >= treeValue
            } else if (typeof (treeValue) === "string") {
                return start <= treeValue && end >= treeValue
            } else {
                return parseInt(start) <= treeValue && parseInt(end) >= treeValue
            }
        }
    }

    //Type-safe method that determines which test is appropriate and returns the result
    const testProperty: Record<keyof ITree, () => boolean> = {
        _id: () => { return tree._id.$oid === filter.value },
        createdAt: () => { return testLhs[filter.lhs!](new Date(tree.createdAt.$date), filter.lhs == "rng" ? filter.value : new Date(filter.value)) },
        projectId: () => { return testLhs[filter.lhs!](tree.projectId, filter.lhs == "rng" ? filter.value : parseInt(filter.value)) },
        style: () => { return testLhs[filter.lhs!](tree.style, filter.value) },
        value: () => { return testLhs[filter.lhs!](tree.value, filter.lhs == "rng" ? filter.value : parseInt(filter.value)) },
        variant: () => { return testLhs[filter.lhs!](tree.variant, filter.value) }
    }

    return testProperty[filter.property]()
}

/**
 * @description Construct a valid object for the client return based on the given select
 */
export const applySelect = (selectText: string, source: ITree): IQueryTree => {
    const selects: (keyof ITree)[] = selectText.split(',') as (keyof ITree)[]

    return selects.reduce((result: any, current) => {
        //Type-safe method that sets the value of the result object to the appropriate value of the source object
        const select: Record<keyof ITree, () => void> = {
            _id: () => result._id = source._id.$oid,
            createdAt: () => result.createdAt = new Date(source.createdAt.$date),
            projectId: () => result.projectId = source.projectId,
            style: () => result.style = source.style,
            value: () => result.value = source.value,
            variant: () => result.variant = source.variant
        }

        select[current]()
        return result
    }, { _id: source._id.$oid })
}

/**
 * @description Sorts the given array of records based on the given sort
 */
const applySort = (trees: IQueryTree[], sort: Sort | undefined) => {
    //If there are no trees, or the property being sorted is not present (potentially due to select), return the array unmodified
    if (!trees.length || !sort || !trees[0][sort.property]) return trees

    return [...trees].sort((a, b) => {
        return a[sort.property]! > b[sort.property]!
            ? sort.direction == "asc"
                ? 1 :
                -1
            : sort.direction == "asc"
                ? -1
                : 1
    })
}

/**
 * @description Applies filters to a given record, returning true if all filters pass
 */
const applyFilters = (tree: ITree, filters: Filter[]): boolean => {
    for (let filter of filters) {
        if (!testFilter(tree, filter)) {
            return false
        }
    }

    return true
}

/**
 * @description Fetches the result of a request's query on the given array of records
 */
export const fetchManyResult = (trees: ITree[], query: TreeQuery): IQueryTree[] => {
    const filteredTrees = trees
        .slice(query.offset, trees.length)
        .filter(tree => { return applyFilters(tree, query.filters) })
        .map(tree => applySelect(query.select, tree))

    const sortedTrees = applySort(filteredTrees, query.sort)
    return sortedTrees.slice(0, query.limit)
}

export const isDate = (v: any): boolean => {
    return !isNaN(v) && v instanceof Date
}
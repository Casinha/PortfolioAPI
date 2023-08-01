import cors from "cors"
import express from "express"
import { readFileSync } from "fs"
import { hostname } from "os"
import { resolve } from "path"
import { IQueryTree, ITree } from "./models"
import { applySelect, defaultSelect, fetchManyResult, parseQuery } from "./utils"

require("dotenv").config()

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const port = parseInt(process.env.PORT ?? "3000")

const router = express.Router()

const fetchData = async (): Promise<ITree[]> => {
    try {
        return JSON.parse(readFileSync(resolve(process.cwd(), "./data/test-data.json"), 'utf8'))
    } catch (err) {
        throw new Error("File could not be read")
    }
}

router.get("/trees", parseQuery, async (req, res) => {
    //Timer for the request
    const start = new Date()

    const trees = await fetchData()

    const finalResult: IQueryTree[] = fetchManyResult(trees, res.locals.query)

    res.json({ data: finalResult, count: finalResult.length, time: new Date().getTime() - start.getTime() })
})

//It is important that this is defined before /trees/:tid as otherwise it will cause confusion when directing requests
router.get("/trees/total", parseQuery, async (req, res, next) => {
    //Timer for the request
    const start = new Date()

    const trees = await fetchData()

    let finalResult: IQueryTree[] = fetchManyResult(trees, res.locals.query)

    res.json({ count: finalResult.length, time: new Date().getTime() - start.getTime() })
})

//It is important that this is defined before /trees/:tid as otherwise it will cause confusion when directing requests
router.get("/trees/byproject", async (req, res, next) => {
    //Timer for the request
    const start = new Date()

    const trees = await fetchData()

    const count = trees
        .filter(t => !!t.projectId) // ignore those with no projectId
        .reduce((acc, tree) => {
            if (!acc[tree.projectId]) acc[tree.projectId] = 0;

            acc[tree.projectId] += tree.value;
            return acc;
        }, {} as Record<number, number>)

    res.json({ data: count, time: new Date().getTime() - start.getTime() })
})

router.get("/trees/:tid", async (req, res) => {
    const start = new Date()

    const trees = await fetchData()

    const tree = trees.find(t => t._id.$oid === req.params.tid)

    if (!tree) {
        return res.json({ data: undefined, time: new Date().getTime() - start.getTime() })
    }

    const select = <string>req.query.select ?? defaultSelect

    const treeObj = applySelect(select, tree)

    res.json({ data: treeObj, time: new Date().getTime() - start.getTime() })
})

app.use(router)

//Start the server using port specified as environment variables, with defaults in case they haven't been set
app.listen(port, () => {
    console.info(`Express server trees-api is running at ${hostname()}:${port}`)
})

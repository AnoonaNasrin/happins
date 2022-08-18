const categoryschema = require("../model/categoryschema");

module.exports = {

    getCategory: () => {
        return new Promise(async (res, rej) => {
            const category = await categoryschema.find({}).lean()
            res(category)
        })
    }
}


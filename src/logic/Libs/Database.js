const sqlite3 = req('sqlite3');
const SEPARATOR_DEFAULT = ', ';
const SEPARATOR_AND = ' AND ';

module.exports = class Database{

    open(filename){
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(filename, sqlite3.OPEN_READWRITE, err => {
                if(err) reject(err);
                else resolve();
            });
        });
    }

    close(){
        this.db.close();
    }

    async findOne(table, filters){
        const items = await this.select(table, filters);
        if(items.length){
            return items[0];
        }else{
            return null;
        }
    }

    select(table, filters, order, limits){
        let aq = '';
        if(order){
            if(order.desc)
                aq = `ORDER BY ${order.desc} DESC`;
            else if(order.asc)
                aq = `ORDER BY ${order.asc} ASC`;
        }
        if(limits){
            aq += ' LIMIT ';
            if(typeof limits == 'object'){
                aq += `${limits.start}, ${limits.limit}`;
            }else{
                aq += limits;
            }
        }
        return this.query(`SELECT * FROM ${table}`, null, filters, aq);
    }

    async update(table, values, filters){
        await this.query(`UPDATE ${table} SET`, values, filters);
        return true;
    }

    async insert(table, values){
        const single = !(values instanceof Array);
        const items = single ? [values] : values;
        const ids = [];
        for(let item of items){
            const pp = this._prepareParams(item, null, null, true);
            const sql = `INSERT INTO ${table} (${pp.list.join(', ')}) VALUES (${pp.query})`;
            const insertId = await this.run(sql, pp.params);
            ids.push(insertId);
        }
        return single ? ids[0] : ids;
    }

    async delete(table, filters){
        await this.query(`DELETE FROM ${table}`, null, filters);
        return true;
    }



    query(query, params, filters, aq){
        let finalParams = null;
        let q = query;
        if(params){
            const pp = this._prepareParams(params);
            if(pp.query){
                q += ' ' + pp.query;
                finalParams = pp.params;
            }
        }
        if(filters){
            const pp = this._prepareParams(filters, 'w_', SEPARATOR_AND);
            if(pp.query){
                q += ' WHERE ' + pp.query;
                if(finalParams){
                    finalParams = { ...finalParams, ...pp.params };
                }else{
                    finalParams = pp.params;
                }
            }
        }
        if(aq){
            q += ' ' + aq;
        }
        return this.get(q, finalParams);
    }

    get(query, params){
        return new Promise((resolve, reject) => {
            this.db.all(query, params || [], (err, rows) => {
                if(err) reject(err);
                else resolve(rows);
            });
        });
    }

    run(query, params){
        return new Promise((resolve, reject) => {
            this.db.run(query, params || [], function(err) {
                if(err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    _prepareParams(parameters, prefixVars, separator, skipName){
        const sep = separator || SEPARATOR_DEFAULT;
        const prefix = '$' + (prefixVars || '');
        const list = [];
        let query = '';
        let params = {};
        for(let p in parameters){
            if(!parameters.hasOwnProperty(p)) continue;
            list.push(p);
            const varName = prefix + p;
            const pv = parameters[p];
            if(query) query += (typeof pv == 'object' && pv.sep_op) || sep;
            if(skipName){
                query += varName;
                params[varName] = parameters[p];
            }else{
                if(typeof pv == 'object'){
                    const _p = pv.custom ? pv.custom : p;
                    if(typeof pv.escapeValue == "boolean" && !pv.escapeValue){
                        query += `${_p} ${pv.op} ${pv.val}`;
                    }else{
                        query += `${_p} ${pv.op} ${varName}`;
                        params[varName] = pv.val;
                    }
                }else{
                    query += `${p} = ${varName}`;
                    params[varName] = pv;
                }
            }
        }
        return {
            query,
            params,
            list
        }
    }

}
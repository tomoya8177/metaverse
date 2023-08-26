import { DBHost, DBName, DBPassword, DBUser } from '$env/static/private';
import mysql from 'mysql2/promise';
const dbConfig = {
	host: DBHost,
	user: DBUser,
	password: DBPassword,
	database: DBName,
	timezone: 'Z'
};

class DB {
	pool: mysql.Pool;
	constructor() {
		this.pool = mysql.createPool(dbConfig);
	}
	query = async (sql: string): Promise<any[]> => {
		console.log(sql);
		const connection = await this.pool.getConnection();
		const [rows] = await connection.query({ sql });
		connection.release();
		return rows as Array<any> | any;
	};
	fields = async (tableName: string) => {
		const connection = await this.pool.getConnection();
		const [rows] = await connection.query({ sql: `describe ${tableName}` });
		connection.release();
		return rows as Array<any>;
	};
}
export const db = new DB();

import * as path from 'path';
import * as sqlite from 'sqlite3';
import * as fs from 'fs-extra';
import Logger from './Logger';
import Directory from './Directory';

/**
 * It is used to manage the database connection.
 */
export default class Database {
  private static DBName: string = 'OSTFacilitator';

  private static connection: sqlite.Database;

  /**
   * This method provides database connection if the path is correct.
   * @param dbPath Database file path for sqlite.
   * @returns {sqlite.Database} Db connection object.
   */
  public static getConnection(dbPath: string): sqlite.Database {
    if (Database.connection === undefined || Database.connection === null) {
      if (!(Database.verify(dbPath))) {
        throw new Error('database file path is invalid');
      }
      Database.connection = new sqlite.Database(dbPath);
    }

    return Database.connection;
  }

  /**
   * It verifies whether the file path is valid.
   * @param {string} filePath Database file path.
   * @returns {boolean} `true` if file path is valid.
   */
  public static verify(filePath: string): boolean {
    if ((fs.existsSync(filePath) && (path.extname(filePath) === '.db'))) {
      Logger.info('db file verified');
      return true;
    }
    return false;
  }

  /**
   * It creates database and returns the file path.
   * @param chain chain id of the aux chain.
   * @returns {string} Database file path.
   */
  public static create(chain: string): string {
    if (chain === null || chain.length === 0) {
      throw new Error('invalid chain id');
    }
    const dbPath: string = Directory.getDBFilePath(chain);
    fs.ensureDirSync(dbPath);
    const facilitatorConfigDB = path.join(dbPath, `${`${Database.DBName}.db`}`);
    Database.connection = new sqlite.Database(facilitatorConfigDB);
    return dbPath;
  }
}

import * as path from 'path';
import * as sqlite from 'sqlite3';
import * as fs from 'fs-extra';
import Logger from './Logger';
import Directory from './Directory';

/**
 * It is used to manage the database connection.
 */
export default class DBConnection {
  private static DBName: string = 'OSTFacilitator';

  private static connection: any;

  /**
   * It is used to return the database connection object and path of the db file.
   * @param dbPath Database file path for sqlite.

   * @returns {any} Db connection object.
   */
  public static getConnection(dbPath: string): any {
    if (DBConnection.connection === undefined || DBConnection.connection === null) {
      DBConnection.verify(dbPath);
      DBConnection.connection = new sqlite.Database(dbPath);
    }

    return DBConnection.connection;
  }

  /**
   * It verifies whether the file path is valid.
   * @param {string} filePath Database file path.
   */
  public static verify(filePath: string): void {
    if ((fs.existsSync(filePath) && (path.extname(filePath) === '.db'))) {
      Logger.info('db file verified');
    } else {
      Logger.error('either file doesn\'t or file extension is incorrect');
      process.exit(1);
    }
  }

  /**
   * It creates database and returns the file path.
   * @returns {string} Database file path.
   */
  public static create(chain: string): string {
    const dbPath = Directory.getDBFilePath(chain);
    fs.ensureDirSync(dbPath);
    const facilitatorConfigDB = path.join(path.join(dbPath, `${`${DBConnection.DBName}.db`}`));
    DBConnection.connection = new sqlite.Database(facilitatorConfigDB);
    return facilitatorConfigDB;
  }
}


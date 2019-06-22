// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------

/* eslint-disable class-methods-use-this */

import {
  DataTypes, Model, InitOptions, Op,
} from 'sequelize';

export class MessageModel extends Model {}

/**
 * To be used for calling any methods which would change states of record(s) in Database.
 */
export interface MessageAttributes {
  messageHash: string;
  type: string;
  gatewayAddress: string;
  sourceStatus: string;
  targetStatus: string;
  gasPrice: number;
  gasLimit: number;
  nonce: number;
  sender: string;
  direction: string;
  sourceDeclarationBlockHeight: number;
  secret?: string;
  hashLock?: string;
}

/**
 * Repository would always return database rows after typecasting to this
 */
export interface Message extends MessageAttributes{
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns statuses which are used for sourceStatus & targetStatus
 * @return {Array<String>}
 */
export const statusesArray = [
  'Undeclared',
  'Declared',
  'Progressed',
  'RevocationDeclared',
  'Revoked',
];

export class MessageRepository {
  /* Public Functions */

  public constructor(initOptions: InitOptions) {
    MessageModel.init(
      {
        messageHash: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        type: {
          type: DataTypes.ENUM({
            values: ['stakeAndMint', 'redeemAndUnstake'],
          }),
          allowNull: false,
        },
        gatewayAddress: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isAlphanumeric: true,
            len: [42, 42],
          },
        },
        sourceStatus: {
          type: DataTypes.ENUM({
            values: statusesArray,
          }),
          allowNull: false,
        },
        targetStatus: {
          type: DataTypes.ENUM({
            values: statusesArray,
          }),
          allowNull: false,
        },
        gasPrice: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        gasLimit: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        nonce: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        sender: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isAlphanumeric: true,
            len: [42, 42],
          },
        },
        direction: {
          type: DataTypes.ENUM({
            values: ['o2a', 'a2o'],
          }),
          allowNull: false,
        },
        sourceDeclarationBlockHeight: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        secret: {
          type: DataTypes.STRING,
          validate: {
            isAlphanumeric: true,
          },
        },
        hashLock: {
          type: DataTypes.STRING,
          validate: {
            isAlphanumeric: true,
          },
        },
      },
      {
        ...initOptions,
        modelName: 'message',
        tableName: 'message',
      },
    );
  }

  /**
   * Creates a message model in the repository and syncs with database.
   * @param {MessageAttributes} messageAttributes
   * @return {Promise<Message>}
   */
  public async create(messageAttributes: MessageAttributes): Promise<Message> {
    try {
      return await MessageModel.create(messageAttributes) as Message;
    } catch (e) {
      const errorContext = {
        attributes: messageAttributes,
        reason: e.message,
      };
      return Promise.reject(`Failed to create a message: ${JSON.stringify(errorContext)}`);
    }
  }

  /**
   * Fetches message data from database.
   * @param {string} messageHash
   * @return {Promise<Message | null>}
   */
  public async get(messageHash: string): Promise<Message | null> {
    const message = await MessageModel.findOne({
      where: {
        messageHash,
      },
    });

    if (message === null) {
      return null;
    }

    return message as Message;
  }

  /**
   * Updates message data in database and does not return the updated state.
   * @param {MessageAttributes} messageAttributes
   * @return {Promise<Array<Number>>}
   */
  public async update(messageAttributes: MessageAttributes): Promise<number[]> {
    return await MessageModel.update(messageAttributes, {
      where: {
        messageHash: {
          [Op.eq]: messageAttributes.messageHash,
        },
      },
    });
  }
}

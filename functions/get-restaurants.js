const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const Log = require('@dazn/lambda-powertools-logger')

const { serviceName, stage } = process.env
const dynamoDB = new DocumentClient()
const tableName = process.env.restaurants_table

const ssmConfig = {
  cache: true,
  cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
  names: { config: `/${serviceName}/${stage}/get-restaurants/config` },
  onChange: () => {
    const config = JSON.parse(process.env.config)
    process.env.defaultResults = config.defaultResults
  }
}

const getRestaurants = async count => {
  Log.debug('getting restaurants from DynamoDB...', {
    count,
    tableName
  })
  const req = {
    TableName: tableName,
    Limit: count
  }

  const resp = await dynamoDB.scan(req).promise()
  Log.debug('found restaurants', {
    count: resp.Items.length
  })
  return resp.Items
}

const handler = async (event, context) => {
  const restaurants = await getRestaurants(process.env.defaultResults)
  return {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }
}

module.exports.handler = middy(handler).use(ssm(ssmConfig))
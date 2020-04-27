# http-loop-example

This is **experimental work** on an API Builder plugin that loops through collections of records and do subsequent requests for each of them.

To play with the example flows:

* clone the repo
* npm install
* npm start

Note that the plugin is local for the project and resides in a folder called `api-builder-plugin-httploop`. For plugin config options see `conf/httploop.default.js`.

# Available Methods
Brief explanation of available methods is bellow.

## Request

Standard http request method usually used to get the master collection of records. It also allows you:

### Works with parametrized URL

Replace single parameter:
```
URL Values: "users"

Parametrized URL: https://jsonplaceholder.typicode.com/{modelType}

Will produce: https://jsonplaceholder.typicode.com/users
```


Replace parameters sequentilly:
```
URL Values: ["users", "1"]

Parametrized URL: https://jsonplaceholder.typicode.com/{modelType}/{number}

Will produce: https://jsonplaceholder.typicode.com/users/1
```

### Provide built-in API Key Credential parameter

It must be associated with credential of type apiKey.

For example if you set in headers:
```
{
 "Authorization": "Bearer {apiKey}"
}
```
apiKey will be replaced from what you have in your API Key Credential parameter and send as `Authorization` header. You can use name for the header based on your needs but `apiKey` must be kept as it is shown: `{apiKey}`

## Loop
Takes data collection and parametrized URL and do subsequent request to collect details about each record from the collection based on properties used in the parametrized URL.

Arra of objects works for multiple parameters in the URL. For each object of the collection takes the properties that are named the same as parametrized part of the URL and replaces them with their corresponding values:
```
Loop Over: [{
  id: 1,
  postCode: '123'
},
{
  id: 2,
  postCode: '456'
}]

URL: https://jsonplaceholder.typicode.com/users/{id}?pc={postCode}


Will Produce: 

- https://jsonplaceholder.typicode.com/users/1?pc=123
- https://jsonplaceholder.typicode.com/users/2?pc=456
```

Array of strings works with single parameter in the URL:
```
Loop Over: ["1", "2", "3"]

URL: https://jsonplaceholder.typicode.com/users/{id}

Will Produce: 
- https://jsonplaceholder.typicode.com/users/1
- https://jsonplaceholder.typicode.com/users/2
- https://jsonplaceholder.typicode.com/users/3
```



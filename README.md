# Restful API for Portfolio

## Requirements:

 * Node/npm must be installed on your machine

## Setup:

After cloning the repository:

* run `npm install`
* (Optional) created a .env file in the root directory specifying HOST (string) and PORT (number), this will drive the hostname and port for the server, otherwise defaults of localhost and 3000 will be used respectively
* run `npm start`
* in a browser, navigate to the url displayed in the console

## Usage:

The server exposes the following REST End-Points:

### GET: /trees
**Description:** Retrieves an array of trees according to the user's specification
**Query Parameters:**
* **limit:** The maximum number of items to be returned (defaults to 1000, a value of 0 means there is no limit)
* **offset:** The row index to start from, allowing the user to skip rows and implement paging (defaults to 0)
* **select:** A comma-separated string specifying which properties should be provided on each returned tree (defaults to all properties, id is always provided)
* **sort:** A colon-separated property|asc/dsc pair that specifies a property to sort the returned collection by (for example ?sort=value:asc, or ?sort=createdAt, which defaults to descending)
* **property name (value, createdAt, variant etc.):** A value that specifies a filter for the query. The user must specify 'equal' 'less than', 'greater than' etc. using a square bracketed indicator provided prior to the filter value. In the case of rng (range), the value should be a semi-colon separated string with the smaller value followed by the larger value. If a filter is being provided for a date, it must be of the YYYY-MM-DD format (time can also be provided e.g. 2022-03-01:10:30:23). For example: ?variant=[eq]"a" or ?projectId=[gte]5 or ?createdAt=[rng]2022-03-01;2022-03-31
  * The following filters are available:
    * eq - Equal to
    * lte - Less than or equal to
    * lt - Less than
    * gte - Greater than or equal to
    * gt - Greater than
    * rng - Within a range

**Returns:**
An object with the data (an array of trees), the total count of items returned, and the time taken to complete the action in milliseconds

#### Examples
* To retrieve all "normal" trees: /trees?variant=[eq]normal
* To retrieve all trees entered in march of 2022, sorted by creation date: /trees?createdAt=[rng]2022-03-01;2022-03-31:23:59:59&sort=createdAt:asc&limit=0

### GET: /trees/total
**Description:** Retrieves the total number of trees matching the given query
**Query Parameters:**
* **property name (value, createdAt, variant etc.):** Same as for /trees
**Returns:**
An object with the count (total number of trees matching the query), and the time taken to complete the action in milliseconds

### Examples
* To retrieve the total number of trees: /trees/total
* To retrieve the total number of "normal" trees /trees/total?variant=normal

### GET: /trees/:id
**Description:** Retrieves the tree from the data source with an id matching :id.
**Returns:**
An object with the data (the tree with the matching id, or undefined if no matchin tree was found), and the time taken to complete the action in milliseconds

### Examples
* To retrieve a specific tree: /trees/5f22dde634a79c001907f5dc

### GET: /trees/byproject
**Description:** Retrieves an key/value object with the project id as the key and the total number of trees for that given project as the value.

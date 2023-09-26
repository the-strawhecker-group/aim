Welcome to the *AIM API*!

<!-- The AIM API is in an "beta stage" to gather customer feedback. While in beta, the API may change in backwards incompatible ways to accommodate for fixes and additions. Breaking changes will be communicated to the primary API contact at least 2 business days in advance.

TSG reserves the right to determine what constitutes a breaking changes. A definition of "breaking changes" will be made available before formal release. -->

# HTTP API

## API Discovery

In order to reduce client coupling, the AIM API provides an API discovery document available at:

<a class="discovery-config-url"></a>

<pre><code id="discovery-config">https://aim.thestrawgroup.com/api.json</code></pre>

The primary attributes of interest is the `urls` object, which provides static names to full or partial URLs.

## Authentication

The AIM API leverages [Firebase Authentication](https://firebase.google.com/docs/auth) to securely authenticate services and users. To enable API usage, service accounts are created and used to generate a secret Refresh Token that is given to the primary API contact.

These Refresh Tokens do not expire and can be used to retrieve short lived ID Tokens. ID Tokens are used to directly communicate with the AIM API, which will validate the ID Token.

In short, the authentication flow looks like the following:
1. Exchange a Refresh Token for an ID Token with Firebase
2. Use the ID Token with the AIM API
3. Repeat step 1 as the previous ID Token expires

![Authentication Flow](./authentication_flow.png)

Once acquired, the ID Token must be sent in the `Authorization` HTTP Header as a `Bearer` token.

As ID Tokens are short lived, a new one must be fetched before expiration and replaced in requests to the API. ID Tokens are [JSON Web Tokens](https://jwt.io/), so any standard JWT libary can be used to decode them and inspect the `exp` entry for a Unix timestamp after which the token will be rejected by the API. A number of JWT libraries are referenced in the link above.

### Obtain an ID Token

In order to obtain an ID Token, use the `id_token` url from the [Discovery document](#api-discovery), which allows us to exchange our Refresh Token for a fresh ID Token.

<a class="id_token-url"></a>

Make a POST request with the following payload, injecting the Refresh Token as specified: `{"grant_type": "refresh_token", "refresh_token": <API Key>}`. Extract the `id_token` field from the response, which contains the ID Token, which can then be sent to the API.

For example, with `curl` to make the request and `jq` to extract the field:

```sh
ID_TOKEN_URL="<ID Token Discovery URL>"
API_KEY="<Refresh Token>"
curl -fsSl -XPOST \
     -H "Content-Type: application/json" \
     -d "{\"grant_type\": \"refresh_token\", \"refresh_token\": \"$API_KEY\"}" \
     "$ID_TOKEN_URL" \
     | jq -r '.id_token'
```

Sample example with `python` to consume ID Token Discovery URL and to obtain id_token

```sh
res=requests.get("https://aim.thestrawgroup.com/api.json").json()
id_token_url=res["v1"]["urls"]["id_token"]
BASE_URL=res["v1"]["urls"]["warehouse"]
body= {
            "grant_type":"refresh_token",
            "refresh_token":"Your API Key"
        }
access_token=requests.post(id_token_url, data=body).json()
ID_TOKEN=access_token["id_token"]
```

You now have an ID Token that can be used with the AIM API!

### Abuse and Privacy

In order to prevent abuse and data leaks, Refresh Tokens must be stored securely. In particular, avoid unneeded sharing of Refresh Tokens or storing them in source files/source control.

If you suspect your Refresh Token has been compromised, contact <mailto:AIM@thestrawgroup.com> as soon as possible. If abuse is suspected, TSG may disable Refresh Tokens immediately and follow up with the API contact.

## Query API

The Query API is the primary tool provided by the AIM API. It provides powerful data analysis across multiple dimensions of the AIM dataset.

The Query API is comprised of four (4) primary components:
- `aggregation`
- `attribute`
- `metric`
- `normalization`

Each component has a discovery endpoint to obtain the available items with full metadata. All query urls are based from the `warehouse` url in the [discovery document](#api-discovery):

<code class="warehouse-url"></code>

<!-- ![Alt text](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGZORV3utLrfbJSDS7iI5AthCt7aihIfkomZtsWIQfgyB5qTZTmyImkXsfCSMZrwXx1do&usqp=CAU)  -->


### Important Update


``` diff
-  1) The portfolio is a required parameter to be pass with every API request.
- 2) You can toggle between the market benchmark and the fluid benchmark by setting portfolio=-1 for the 
-    market benchmark and portfolio=-2 for the fluid benchmark.
- 3) The default for Standalone / Household attribute is changed to [household] from [standalone].
- 4) "Attrition And Growth Metrics" can not be selected with default Standalone/Household Attribute value as 
-     household does not support "Attrition And Growth Metrics". To query Attrition And Growth Metrics, 
-     standalone parameter must be passed with value either all_merchants or standalone]. 
```

   **For example,**
```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/query?metrics=gross_volume_attrited&filter=date=2022-07,2022-07;portfolio={your portfolio id}; \
     standalone=all_merchants;industry_group=1,2,3,4,5;region=2,3,4,5,6,7,8,9,10&group_by=date,portfolio& \
     aggregation=none&normalizations=volume__last_year&baseline=-1"
```   
     
**Possible values for Standalone/Household Attribute** 
```sh
      Standalone – When this option is selected, the metrics calculated at individual store level and 
                   only the MIDs that are not part of chain are used in calculations.
      All Merchants - When this option is selected, the metrics are calculated at individual store level 
                    and both chained MIDs and non-chained MIDs are used in calculations.
      Household (default option)  - When household is selected, the metrics are calculated at Household level,
                    i.e. standalone stores are considered as a household with one store and chained stores 
                    within a chain are combined together and considered as one single Household.                   
#NOTE:  Growth/Attrition metrics are not supported with Household option
```


### Quickstart

After [acquiring an ID Token](#obtain-an-id-token), start with a few simple API calls. The calls will use `curl` for demonstration, but of course, any HTTP client will do. In these examples, `BASE_URL` is set to <code class="warehouse-url"></code>. Any query results are for demonstration purposes only and do not represent real values.

```sh
# Inspect all attributes. Note the rich metadata describing the data type, filter config and values, among other 
  things. These attributes determine how the data can be filtered and grouped.
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/attribute/"

# Inspect all metrics. Notice that metrics have "availability" metadata describing what attributes and 
  normalizations they support.
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/metric/"

# Let's run a query to pull out volume data:

# Example with market benchmark
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-1"
# [
#   {
#     "volume":12864.75939
#   }
# ]

# Example with fluid benchmark
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-2"
 
# [
#   {
#    "volume": 12903.352
#   }
# ]

# By default, calculations are "Per Merchant", but another normalization can be selected. Let's try some 
  different metrics with "Per Transaction"

# Example with market benchmark
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-1&normalizations=transaction"
# [
#   {
#     "volume": 73.43840
#   }
# ]

# Example with fluid benchmark
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-2&normalizations=transaction"
 
# [
#   {
#     "volume": 103.352
#   }
# ]


# You can also pass your portfolio id with the market benchmark and the fluid benchmark value and group by portfolio
  to see the desired result.
 
# Note: Benchmark(s) cannot be selected with other portfolios without 'Group by Portfolio'

# Example with Market Benchmark
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-1,{your portfolio id}&group_by=portfolio& \
        normalizations=transaction"
 
# [
#   {
#     "portfolio": {your portfolio id},
#     "volume": 79.195
#   },
#   {
#     "portfolio": -1,
#     "volume": 102.963
#   }
# ]
 
# Example with Fluid Benchmark
 
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-2,{your portfolio id}&group_by=portfolio& \
        normalizations=transaction"                                                                                                                                                                                                                                                                                                           
# [
#   {
#     "portfolio": {your portfolio id},
#     "volume": 79.195
#   },
#   {
#     "portfolio": -2,
#     "volume": 103.352
#   }
# ]
 

# Example with Market and Fluid Benchmark
 
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-2,-1,{your portfolio id}&group_by=portfolio& \
        normalizations=transaction"
 
# [
#   {
#     "portfolio": -2,
#     "volume": 103.352
#   },
#   {
#     "portfolio": {your portfolio id},
#     "volume": 79.195
#   },
#   {
#     "portfolio": -1,
#     "volume": 102.963
#   }
# ]

# In addition to filtering by a specific month, a range can be provided. Once a date range has been specified, it can
  be "grouped" so the result set contains the average for each month, instead of the average across the months:

curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01,2020-03;portfolio=-1&group_by=date"
# [
#   {
#     "date": "2020-01-01",
#     "volume": 28352.73849
#   },
#   {
#     "date": "2020-02-01",
#     "volume": 27424.03418
#   },
#   {
#     "date": "2020-03-01",
#     "volume": 38738.38481
#   }
# ]

# Now, let's see the volume for credit and sig debit:

curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-1;card=credit,sig_debit&group_by=card"
# [
#  {
#    "card": "credit",
#    "volume": 28327.3061
#  },
#  {
#    "card": "sig_debit",
#    "volume": 1924.48568
#  }
#]

# How about focused on Omaha, Iowa, Kansas, and Missouri?

curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01;portfolio=-1;card=credit,sig_debit;state=MO,KS,NE,IA&group_by=card"
# [
#   {
#     "card": "credit",
#     "volume": 23394.83581
#   },
#   {
#     "card": "sig_debit",
#     "volume": 1483.83589
#   }
# ]

# Putting these examples together, one can see metrics per transaction in specific states grouped by card and date.

curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/query?metrics=volume&filter=date=2020-01,2020-03;portfolio=-1;card=credit,sig_debit;state=MO,KS,NE,IA&group_by=date,card&normalizations=transaction"
# [
#   {
#     "card": "credit",
#     "date": "2020-01-01",
#     "volume": 53.77786
#   },
#   {
#     "card": "sig_debit",
#     "date": "2020-01-01",
#     "volume": 8.38631
#   },
#   {
#     "card": "credit",
#     "date": "2020-02-01",
#     "volume": 68.85441
#   },
#   {
#     "card": "sig_debit",
#     "date": "2020-02-01",
#     "volume": 2.41721
#   },
#   {
#     "card": "credit",
#     "date": "2020-03-01",
#     "volume": 58.09631
#   },
#   {
#     "card": "sig_debit",
#     "date": "2020-03-01",
#     "volume": 5.42187
#   }
# ]
```

### Aggregation

Abstract aggregation operation.
    

<details markdown='1'><summary>Aggregations</summary>

|	Name	               | Periods	|	Frequency	|	Aggregation id	          |
|:-----------------------|:--------|:-------------|:----------------------------|
|	Trailing 3-Months	|	3	|	Month	|	3_month_moving_average	|
|	Trailing 6-Months	|	6	|	Month	|	6_month_moving_average	|
|	Trailing 12-Months	|	12	|	Month	|	12_month_moving_average	|
|	Trailing 18-Months	|	18	|	Month	|	18_month_moving_average	|

    

</details>

### Attributes

Attributes provide the ability to filter and slice data.

    

<details markdown='1'><summary>Attributes</summary>

#### Card

**Card** is an attribute of central importance in the AIM system.

There are 5 basic card types:
- credit
- signature_debit aka *sig_debit*
- pin_debit
- opt_blue

And 2 non-basic card types:
- bank_cards (credit + sig_debit)
- other_cards

The metrics coming from raw processor data which are reported on individual
card types may be filtered and grouped by card types and are referred to as
"card metrics" as opposed to "non-card metrics".

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/card"
```   

#### Default Values if none is passed as query parameters:

[BANK_CARDS, OPT_BLUE, PIN_DEBIT, OTHER_CARDS]

#### Average Ticket Tier

A merchant's ticket tier is based on its **average** number of transactions (or "tickets")
over a rolling 12 month period.

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/average_ticket_tier"
``` 

#### Annual Volume Tier

A merchant's volume tier is based on its **total** volume over a rolling 12 month period.

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/volume_tier"
```     

#### Region

Geographic region of the transaction.

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/region"
``` 

#### Default Values if none is passed as query parameters:

All Regions included except Canada
    

#### State

U.S. State of the transaction

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/state"
``` 

#### ZIP

Zip code of the transaction
```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/zip"
``` 

#### MSA

City of the transaction

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/msa"
``` 

#### Sales Model

Sales model code

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/sales_model_code"
``` 
#### Industry Classification Type

Industry Classification Type. Currently this is either MCC or SIC.
    

#### Industry Group

Hierarchical grouping of Industries

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/industry_group"
``` 

#### Default Values if none is passed as query parameters:

All Industry Group included except Higher Risk
    

#### Industry

Industry the merchant belongs to.

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/industry"
``` 
    

#### Portfolio

A grouping of merchants within an organization.

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/portfolio"
```     

#### Data Month

Date is one of the AIM required attributes.
Traditionally date has been by month due to month being the frequency of the aim
application, though other aggregation levels are possible and may show up in the
future. The term era is used to denote a chunk of time. Ex. The month of June, as
opposed to June 1.

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/date"
``` 

#### Standalone / Household Merchants

Binary on if the merchant is part of a chain or not.

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/standalone"
``` 

#### Default Values if none is passed as query parameters:

Default is changed to [household] from [standalone]


#### Vintage

Year merchant entered the market

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/attribute/vintage"
``` 

</details>

### Metrics

Base metric class.

```sh
      curl -H "Authorization: Bearer $ID_TOKEN" \
     "$BASE_URL/metric/"
```     

<details markdown='1'><summary>Metrics</summary>

| Metric Category |AIMvision Metric Name        | Metric Definition                       | Applicable Card (or Volume) Type  | Metric id    |Normalizations      |
|:---------------:|-----------------------------|:----------------------------------------|:----------------------------------|:-------------|:-------------------|
|	Activity	|	Volume per Merchant	|	Measures average account size of total volumes per active merchant	|	Total, Bankcard, PIN Debit, OptBlue, Other	|	volume	|	Per Merchant	|
|	Activity	|	Volume per Transaction	|	Total volume divided by total transactions	|	Total, Bankcard, PIN Debit, OptBlue, Other, Credit, Signature Debit	|	volume	|	Per Transaction	|
|	Revenue	|	Total Gross Revenue Charged to Merchant per Volume	|	Sum of bankcard, PIN debit and OptBlue gross revenue, total monthly and annual legacy and emerging account fees, total equipment and other income divided by total volume	|	Total	|	rev__gross	|	Per Volume	|
|	Revenue	|	Total Gross Revenue Charged to Merchant per Merchant	|	Sum of bankcard, PIN debit and OptBlue gross revenue, total monthly and annual legacy and emerging account fees, total equipment and other income divided by total active merchants	|	Total	|	rev__gross	|	Per Merchant	|
|	Revenue	|	Total Gross Revenue Charged to Merchant per Transaction	|	Sum of bankcard, PIN debit and OptBlue gross revenue, total monthly and annual legacy and emerging account fees, total equipment and other income divided by total transactions	|	Total	|	rev__gross	|	Per Transaction	|
|	COS	|	Total Cost of Sales per Volume	|	Sum of bankcard, PIN debit and OptBlue total cost of sales and total other cost of sales divided by total volume	|	Total	|	cost__total	|	Per Volume	|
|	COS	|	Total Cost of Sales per Merchant	|	Sum of bankcard, PIN debit and OptBlue total cost of sales and total other cost of sales divided by total active merchants	|	Total	|	cost__total	|	Per Merchant	|
|	COS	|	Total Cost of Sales per Transaction	|	Sum of bankcard, PIN debit and OptBlue total cost of sales and total other cost of sales divided by total transactions	|	Total	|	cost__total	|	Per Transaction	|
|	Revenue	|	Net Revenue per Volume	|	Total gross revenue charged to merchant less total cost of sales divided by total volume	|	Total	|	rev__net	|	Per Volume	|
|	Revenue	|	Net Revenue per Merchant	|	Total gross revenue charged to merchant less total cost of sales divided by total active merchants	|	Total	|	rev__net	|	Per Merchant	|
|	Revenue	|	Net Revenue per Transaction	|	Total gross revenue charged to merchant less total cost of sales divided by total transactions	|	Total	|	rev__net	|	Per Transaction	|
|	Revenue	|	 Discount Revenue per Volume	|	Sum of discount revenue divided by volume for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__discount	|	Per Volume	|
|	Revenue	|	 Transaction Fee Revenue per Volume	|	Sum of transaction fee revenue divided by volume for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__transaction__fees	|	Per Volume	|
|	Revenue	|	 Other Processing Fee Revenue per Volume	|	Sum of other fee revenue divided by volume for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__other__fees	|	Per Volume	|
|	Revenue	|	 Gross Processing Revenue per Volume	|	Sum of discount, transaction fee revenue and other fee revenue divided by volume for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__gross_processing	|	Per Volume	|
|	COS	|	 COS Interchange Fees per Volume	|	Sum of interchange fees divided by volume for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	cost__interchange__fees	|	Per Volume	|
|	COS	|	 COS Association Fees & Assessments Fees per Volume	|	Sum of association fees & assessments divided by volume for applicable card type	|	Bankcard, OptBlue, Credit, Signature Debit	|	cost__association__fees	|	Per Volume	|
|	COS	|	COS SWITCH Fees per Volume	|	Sum of PIN COS SWITCH fees divided by PIN volume	|	PIN Debit	|	cost__switch_fees	|	Per Volume	|
|	COS	|	 COS Association Fees & Assessments & SWITCH Fees per Volume	|	Sum of association fees & assessments and SWITCH fees divided by volume for applicable card type	|	Total	|	cost__association_and_switch_fees	|	Per Volume	|
|	COS	|	 COS Other Processing Fees per Volume	|	Sum of COS other processing fees divided by volume for applicable card type	|	Total, Bankcard, OptBlue, Credit, Signature Debit	|	cost__other__fees	|	Per Volume	|
|	COS	|	COS Total Processing Fees per Volume	|	Sum of interchange, association and assessment fees, SWITCH fees, and COS other processing fees divided by volume for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	cost__processing	|	Per Volume	|
|	Revenue	|	 Net Processing Revenue per Volume	|	Gross processing revenue cos total processing fees divided by volume for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__net_processing	|	Per Volume	|
|	Revenue	|	 Discount Revenue per Merchant	|	Sum of discount revenue divided by active merchants for applicable card type	|	Total, Bankcard, PIN Debit	|	rev__discount	|	Per Merchant	|
|	Revenue	|	 Transaction Fee Revenue per Merchant	|	Sum of transaction fee revenue divided by active merchants for applicable card type	|	Total, Bankcard, PIN Debit	|	rev__transaction__fees	|	Per Merchant	|
|	Revenue	|	 Other Processing Fee Revenue per Merchant	|	Sum of other fee revenue divided by active merchants for applicable card type	|	Total, Bankcard, PIN Debit	|	rev__other__fees	|	Per Merchant	|
|	Revenue	|	 Gross Processing Revenue per Merchant	|	Sum of discount, transaction fee revenue and other fee revenue divided by active merchants for applicable card type	|	Total, Bankcard, PIN Debit	|	rev__gross_processing	|	Per Merchant	|
|	COS	|	 COS Interchange Fees per Merchant	|	Sum of interchange fees divided by active merchants for applicable card type	|	Total, Bankcard, PIN Debit	|	cost__interchange__fees	|	Per Merchant	|
|	COS	|	 COS Association Fees & Assessments Fees per Merchant	|	Sum of association fees & assessments divided by active merchants for applicable card type	|	Total, Bankcard	|	cost__association__fees	|	Per Merchant	|
|	COS	|	COS SWITCH Fees per Merchant	|	Sum of PIN COS SWITCH fees divided by PIN active merchants	|	PIN Debit	|	cost__switch_fees	|	Per Merchant	|
|	COS	|	 COS Association Fees & Assessments & SWITCH Fees per Merchant	|	Sum of association fees & assessments and SWITCH fees divided by active merchants for applicable card type	|	Total	|	cost__association_and_switch_fees	|	Per Merchant	|
|	COS	|	 COS Other Processing Fees per Merchant	|	Sum of COS other processing fees divided by active merchants for applicable card type	|	Total, Bankcard	|	cost__other__fees	|	Per Merchant	|
|	COS	|	COS Total Processing Fees per Merchant	|	Sum of interchange, association and assessment fees, SWITCH fees, and COS processing other fees divided by active merchants for applicable card type	|	Total, Bankcard, PIN Debit	|	cost__processing	|	Per Merchant	|
|	Revenue	|	 Net Processing Revenue per Merchant	|	Gross processing revenue less cos total processing fees divided by active merchants for applicable card type	|	Total, Bankcard, PIN Debit	|	rev__net_processing	|	Per Merchant	|
|	Revenue	|	 Discount Revenue per Transaction	|	Sum of discount revenue divided by transactions for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__discount	|	Per Transaction	|
|	Revenue	|	 Transaction Fee Revenue per Transaction	|	Sum of transaction fee revenue divided by transactions for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__transaction__fees	|	Per Transaction	|
|	Revenue	|	 Other Processing Fee Revenue per Transaction	|	Sum of other fee revenue divided by transactions for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	cost__other__fees	|	Per Transaction	|
|	Revenue	|	 Gross Processing Revenue per Transaction	|	Sum of discount, transaction fee revenue and other fee revenue divided by transactions for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__gross_processing	|	Per Transaction	|
|	COS	|	 COS Interchange Fees per Transaction	|	Sum of interchange fees divided by transactions for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	cost__interchange__fees	|	Per Transaction	|
|	COS	|	 COS Association Fees & Assessments Fees per Transaction	|	Sum of association fees & assessments divided by transactions for applicable card type	|	Total, Bankcard, OptBlue, Credit, Signature Debit	|	cost__association__fees	|	Per Transaction	|
|	COS	|	COS SWITCH Fees per Transaction	|	Sum of PIN COS SWITCH fees divided by PIN transactions	|	PIN Debit	|	cost__switch_fees	|	Per Transaction	|
|	COS	|	 COS Association Fees & Assessments & SWITCH Fees per Transaction	|	Sum of association fees & assessments and SWITCH fees divided by transactions for applicable card type	|	Total	|	cost__association_and_switch_fees	|	Per Transaction	|
|	COS	|	 COS Other Processing Fees per Transaction	|	Sum of COS other processing fees divided by transactions for applicable card type	|	Total, Bankcard, OptBlue, Credit, Signature Debit	|	cost__other__fees	|	Per Transaction	|
|	COS	|	COS Total Processing Fees per Transaction	|	Sum of total interchange, association and assessment fees, SWITCH fees, and COS other processing fees divided by transactions for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	cost__processing	|	Per Transaction	|
|	Revenue	|	 Net Processing Revenue per Transaction	|	Gross processing revenue less cos total processing fees divided by transactions for applicable card type	|	Total, Bankcard, PIN Debit, OptBlue, Credit, Signature Debit	|	rev__net_processing	|	Per Transaction	|
|	Revenue	|	Monthly Legacy Account Fee Revenue per Volume	|	Account related fees charged monthly; including minimums, monthly account fee, statement fee, divided by total volume	|	Total	|	rev__legacy_account_monthly_fees	|	Per Volume	|
|	Revenue	|	Annual Legacy Account Fee Revenue per Volume	|	Account related fees charged annually; including minimums, monthly account fee, statement fee, divided by total volume	|	Total	|	rev__legacy_account_annual_fees	|	Per Volume	|
|	Revenue	|	Monthly Insurance Account Fee Revenue per Volume	|	Account related Insurance fees charged monthly divided by total volume	|	Total	|	rev__insurance_monthly_fees	|	Per Volume	|
|	Revenue	|	Annual  Insurance Account Fee Revenue per Volume	|	Account related Insurance fees charged annually divided by total volume	|	Total	|	rev__insurance_annual_fees	|	Per Volume	|
|	Revenue	|	Monthly PCI Account Fee Revenue per Volume	|	Account related PCI fees charged monthly divided by total volume	|	Total	|	rev__pci_monthly_fees	|	Per Volume	|
|	Revenue	|	Annual PCI Account Fee Revenue per Volume	|	Account related PCI fees charged annually divided by total volume	|	Total	|	rev__pci_annual_fees	|	Per Volume	|
|	Revenue	|	Monthly Govt. Compliance Account Fee Revenue per Volume	|	Account related Government Compliance fees charged monthly divided by total volume	|	Total	|	rev__1099_reporting_monthly_fees	|	Per Volume	|
|	Revenue	|	Annual Govt. Compliance Account Fee Revenue per Volume	|	Account related Government Compliance fees charged annually divided by total volume	|	Total	|	rev__1099_reporting_annual_fees	|	Per Volume	|
|	Revenue	|	Total Monthly Account Fee Revenue per Volume	|	Sum of all monthly account fee revenues divided by total volume	|	Total	|	rev__account_fees_monthly	|	Per Volume	|
|	Revenue	|	Total Annual Account Fee Revenue per Volume	|	Sum of all annual account fee revenues divided by total volume	|	Total	|	rev__account_fees_annual	|	Per Volume	|
|	Revenue	|	Monthly Legacy Account Fee Revenue per Merchant	|	Account related fees charged monthly; including minimums, monthly account fee, statement fee, divided by total active merchants	|	Total	|	rev__legacy_account_monthly_fees	|	Per Merchant	|
|	Revenue	|	Annual Legacy Account Fee Revenue per Merchant	|	Account related fees charged annually; including minimums, monthly account fee, statement fee, divided by total active merchants	|	Total	|	rev__legacy_account_annual_fees	|	Per Merchant	|
|	Revenue	|	Monthly Insurance Account Fee Revenue per Merchant	|	Account related Insurance fees charged monthly divided by total active merchants	|	Total	|	rev__insurance_monthly_fees	|	Per Merchant	|
|	Revenue	|	Annual  Insurance Account Fee Revenue per Merchant	|	Account related Insurance fees charged annually divided by total active merchants	|	Total	|	rev__insurance_annual_fees	|	Per Merchant	|
|	Revenue	|	Monthly PCI Account Fee Revenue per Merchant	|	Account related PCI fees charged monthly divided by total active merchants	|	Total	|	rev__pci_monthly_fees	|	Per Merchant	|
|	Revenue	|	Annual PCI Account Fee Revenue per Merchant	|	Account related PCI fees charged annually divided by total active merchants	|	Total	|	rev__pci_annual_fees	|	Per Merchant	|
|	Revenue	|	Monthly Govt. Compliance Account Fee Revenue per Merchant	|	Account related Government Compliance fees charged monthly divided by total active merchants	|	Total	|	rev__1099_reporting_monthly_fees	|	Per Merchant	|
|	Revenue	|	Annual Govt. Compliance Account Fee Revenue per Merchant	|	Account related Government Compliance fees charged annually divided by total active merchants	|	Total	|	rev__1099_reporting_annual_fees	|	Per Merchant	|
|	Revenue	|	Total Monthly Account Fee Revenue per Merchant	|	Sum of all monthly account fee revenues divided by total active merchants	|	Total	|	rev__account_fees_monthly	|	Per Merchant	|
|	Revenue	|	Total Annual Account Fee Revenue per Merchant	|	Sum of all annual account fee revenues divided by total active merchants	|	Total	|	rev__account_fees_annual	|	Per Merchant	|
|	Revenue	|	Monthly Legacy Account Fee Revenue per Transaction	|	Account related fees charged monthly; including minimums, monthly account fee, statement fee, divided by total transactions	|	Total	|	rev__legacy_account_monthly_fees	|	Per Transaction	|
|	Revenue	|	Annual Legacy Account Fee Revenue per Transaction	|	Account related fees charged annually; including minimums, monthly account fee, statement fee, divided by total transactions	|	Total	|	rev__legacy_account_annual_fees	|	Per Transaction	|
|	Revenue	|	Monthly Insurance Account Fee Revenue per Transaction	|	Account related Insurance fees charged monthly divided by total transactions	|	Total	|	rev__insurance_monthly_fees	|	Per Transaction	|
|	Revenue	|	Annual  Insurance Account Fee Revenue per Transaction	|	Account related Insurance fees charged annually divided by total transactions	|	Total	|	rev__insurance_annual_fees	|	Per Transaction	|
|	Revenue	|	Monthly PCI Account Fee Revenue per Transaction	|	Account related PCI fees charged monthly divided by total transactions	|	Total	|	rev__pci_monthly_fees	|	Per Transaction	|
|	Revenue	|	Annual PCI Account Fee Revenue per Transaction	|	Account related PCI fees charged annually divided by total transactions	|	Total	|	rev__pci_annual_fees	|	Per Transaction	|
|	Revenue	|	Monthly Govt. Compliance Account Fee Revenue per Transaction	|	Account related Government Compliance fees charged monthly divided by total transactions	|	Total	|	rev__1099_reporting_monthly_fees	|	Per Transaction	|
|	Revenue	|	Annual Govt. Compliance Account Fee Revenue per Transaction	|	Account related Government Compliance fees charged annually divided by total transactions	|	Total	|	rev__1099_reporting_annual_fees	|	Per Transaction	|
|	Revenue	|	Total Monthly Account Fee Revenue per Transaction	|	Sum of all monthly account fee revenues divided by total transactions	|	Total	|	rev__account_fees_monthly	|	Per Transaction	|
|	Revenue	|	Total Annual Account Fee Revenue per Transaction	|	Sum of all annual account fee revenues divided by total transactions	|	Total	|	rev__account_fees_annual	|	Per Transaction	|
|	Revenue	|	Equipment & Other (Non-Processing) Revenue per Volume	|	Sum of equipment rental, lease and sale and other revenues divided by total volume	|	Total	|	rev__equipment_and_other	|	Per Volume	|
|	Revenue	|	Equipment & Other (Non-Processing) Revenue per Merchant	|	Sum of equipment rental, lease and sale and other revenues divided by total active merchants	|	Total	|	rev__equipment_and_other	|	Per Merchant	|
|	Revenue	|	Equipment & Other (Non-Processing) Revenue per Transaction	|	Sum of equipment rental, lease and sale and other revenues divided by total transactions	|	Total	|	rev__equipment_and_other	|	Per Transaction	|
|	COS	|	Total Other (Non-Processing) COS per Volume	|	Sum of other cost of sales including gateway fees, processor fees and sponsor bank fees divided by total volume	|	Total	|	cost__other	|	Per Volume	|
|	COS	|	Total Other (Non-Processing) COS per Merchant	|	Sum of other cost of sales including gateway fees, processor fees and sponsor bank fees divided by total active merchants	|	Total	|	cost__other	|	Per Merchant	|
|	COS	|	Total Other (Non-Processing) COS per Transaction	|	Sum of other cost of sales including gateway fees, processor fees and sponsor bank fees divided by total transactions	|	Total	|	cost__other	|	Per Transaction	|
|	COS	|	Residuals Paid per Volume	|	Sum of residuals to 1099 agents, agent banks, integrated referral partners, association referral partners and other referral partners divided by total volume	|	Total	|	cost__residuals	|	Per Volume	|
|	COS	|	Residuals Paid per Merchant	|	Sum of residuals to 1099 agents, agent banks, integrated referral partners, association referral partners and other referral partners divided by total active merchants	|	Total	|	cost__residuals	|	Per Merchant	|
|	COS	|	Residuals Paid per Transaction	|	Sum of residuals to 1099 agents, agent banks, integrated referral partners, association referral partners and other referral partners divided by total transactions	|	Total	|	cost__residuals	|	Per Transaction	|
|	Revenue	|	Net Revenue Net of Residuals per Volume	|	Total net revenue less total residuals divided by total volume	|	Total	|	rev__gross_profit	|	Per Volume	|
|	Revenue	|	Net Revenue Net of Residuals per Merchant	|	Total net revenue less total residuals divided by total active merchants	|	Total	|	rev__gross_profit	|	Per Merchant	|
|	Revenue	|	Net Revenue Net of Residuals per Transaction	|	Total net revenue less total residuals divided by total transactions	|	Total	|	rev__gross_profit	|	Per Transaction	|
|	Attrition	|	Account Attrition	|	Total attrited accounts in given period divided by total portfolio active accounts from same period of the prior year	|	Total	|	attrited_merchant_count	|	Merchant Count of Prior Year	|
|	Growth	|	New Accounts Added	|	Total new accounts in given period divided by total portfolio accounts from same period of the prior year	|	Total	|	new_merchant_count	|	Merchant Count of Prior Year	|
|	Attrition	|	Volume Gross Attrition	|	Total volume of attrited accounts from given period of prior year divided by total portfolio volume from same period of the prior year	|	Total	|	gross_volume_attrited	|	Total Volume of Prior Year	|
|	Attrition	|	Change in Retained Account Volume	|	Annual volume change/growth of retained (non-attrited) accounts for given period divided by total portfolio volume from same period of the prior year	|	Total	|	change_in_retained_volume	|	Total Volume of Prior Year	|
|	Attrition	|	Volume Net Attrition	|	Sum of volume gross attrition and change in retained account volume divided by total portfolio volume from same period of the prior year	|	Total	|	volume_net_attrition	|	Total Volume of Prior Year	|
|	Growth	|	Volume Added from New Accounts	|	Volume added in current period from new accounts divided by total portfolio volume of same period of the prior year 	|	Total	|	new_gross_volume	|	Total Volume of Prior Year	|
|	Attrition	|	Net Revenue Gross Attrition	|	Total net revenue of attrited accounts from given period of prior year divided by total portfolio net revenue from same period of the prior year	|	Total	|	gross_net_revenue_attrited	|	Total Net Revenue of Prior Year	|
|	Attrition	|	Change in Retained Account Net Revenue	|	Annual net revenue change/growth of retained (non-attrited) accounts for given period divided by total portfolio net revenue from same period of the prior year	|	Total	|	change_in_retained_net_revenue	|	Total Net Revenue of Prior Year	|
|	Attrition	|	Net Revenue Net Attrition	|	Sum of net revenue gross attrition and change in retained account net revenue divided by total portfolio net revenue from same period of the prior year	|	Total	|	net_revenue_net_attrition	|	Total Net Revenue of Prior Year	|
|	Growth	|	Net Revenue Added from New Accounts	|	Net revenue added in current period from new accounts divided by total portfolio net revenue of same period of the prior year 	|	Total	|	new_net_revenue	|	Total Net Revenue of Prior Year	|
|	Attrition	|	Average Attrited Account Size	|	Sum of volume gross attrition divided by sum of attrited merchants for given time period; measures size of attriting accounts	|	Total	|	avg_attrited_account_size	|	Per Attrited Merchant	|
|	Attrition	|	Average Retained Account Size	|	Total portfolio volume less attrited volume (volume gross attrition) divided by total portfolio accounts less attrited accounts (account attrition); measures size of retained (non-attrited) accounts	|	Total	|	 avg_retained_account_size	|	Per Retained Merchant	|
|	Growth	|	Average New Account Size	|	Total volume added from new accounts divided by total new accounts; measures size of new accounts	|	Total	|	avg_new_account_size	|	Per New Merchant	|
|	Attrition	|	Net Revenue BPS on Attrited Accounts	|	Gross net revenue attrited divided by gross volume attrited; measures net revenue/pricing on attrited accounts	|	Total	|	avg_net_rev_bps_attrited	|	Per Attrited Volume	|
|	Attrition	|	Net Revenue BPS on Retained Accounts (Pre-Change)	|	Total portfolio net revenue less attrited net revenue divided by total portfolio volume less attrited volume; measures net revenue spread/pricing on retained (non-attrited) accounts prior to their year over year change/growth	|	Total	|	avg_net_rev_bps_retained_pre	|	Per Retained Volume Pre-YOY Change	|
|	Attrition	|	Net Revenue BPS on Retained Accounts (Post-Change)	|	Total retained account net revenue divided by total retained account volumes after the year over year change; measures the net revenue/spread on retained (non-attrited) accounts after the year over year change/growth	|	Total	|	avg_net_rev_bps_retained_post	|	Per Retained Volume Post-YOY Change	|
|	Growth	|	Net Revenue BPS on New Accounts	|	Total net revenue added from new accounts divided by total volume added from new accounts; measures net revenue/pricing on new accounts	|	Total	|	avg_net_rev_bps_new	|	Per New Volume	|


</details>

### Normalization

Abstract Metric Normalizer.

AIM normalizations are of the form: **sum(metric)/sum(normalizing_metric)** .

There are three columns used in AIM normalization (with corresponding units):

- Volume ($)
- Transactions (-)
- Active Merchants (-)

Where "-" is a null unit.

Unit Matrix::

```
===================  ======  ============  ================
Metric / Normalizer  Volume  Transactions  Active Merchants
===================  ======  ============  ================
Transactions           -          -               -
Volume                 -          $               $
All Other Metrics      -          $               $
===================  ======  ============  ================
```

<details markdown='1'><summary>Normalizations</summary>

#### Per Merchant

Active Merchants
In order to be considered active a merchant has to have non-zero Volume and
Net Revenue > 0.
Unitless due to being a count.

#### Per Merchant - Attrited



#### Per Merchant - Retained



#### Per Merchant - Last Year



#### Per Merchant - New



#### Per Transaction

Transactions - Unitless due to being a count.
    

#### Per Volume

Volume - Units in dollars.

#### Per Volume - Attrited



#### Per Change in Volume - Retained 



#### Per Volume - Last Year



#### Per Volume - New



#### Per Net Revenue - Attrited



#### Per Change in Net Revenue - Retained



#### Per Net Revenue - Last Year



#### Per Net Revenue - New



#### Per Merchant - Retained Account Size



#### Per Merchant - Retained Account Size Pre-Change



#### Per Merchant - Retained Account Size Post-Change

</details>

# Merchant-Level Analysis

The **Merchant-Level Analysis** feature allows the user to pull portfolio- and merchant-specific values and compare to an AIM Market Benchmark assigned by the MCC and Annual Volume Tier associated with the merchant record. The user can select subsegments based on Industry Group and Annual Volume Tier along with the Gross or Net Revenue metric to compare. The user will receive an output with the merchant and Market Benchmark values aligned along with a differential column between the merchant and Market Benchmark metric values. The feature can be used to identify opportunities for repricing actions or client retention efforts.

#### Query Parameters necessary to request merchant-level analysis report
<details markdown='1'><summary>List of query parameters</summary>

#### 1.Metric

Below are the possible metrics that can be pass in API.
**Note:**Only one metric can be passed per request.

```
===================        ======================  
Possible Metrics                   id               
===================        ====================== 
Net Revenue                 rev__net                  
Net Processing Revenue      rev__net_processing        
Gross Revenue               rev__gross                 
Gross Processing Revenue    rev__gross_processing      
===================        =======================
```

#### 2.Industry Group
```
# Inspect all industry groups.
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/atrribute/industry_group/"
```

#### 3. Volume-Tier
```
# Inspect all volume-tiers.
curl -H "Authorization: Bearer $ID_TOKEN" \
        "$BASE_URL/atrribute/volume_tier/"
```


**Example request url to pull merchant-level analysis data**

**Net Revenue**
```

        curl -H "Authorization: Bearer $ID_TOKEN" \
                "$BASE_URL/merchant-optimization?industry_group=3,16&volume_tier=7&portfolio=201&       
                metric=rev__net"
```

**Net Processing Revenue**
```
        curl -H "Authorization: Bearer $ID_TOKEN" \
                "$BASE_URL/merchant-optimization?industry_group=3,16&volume_tier=7&portfolio=201&       
                metric=rev__net_processing"
```

**Gross Revenue**
```
        curl -H "Authorization: Bearer $ID_TOKEN" \
                "$BASE_URL/merchant-optimization?industry_group=3,16&volume_tier=7&portfolio=201&       
                metric=rev__gross"
```

**Gross Processing Revenue**
```
curl -H "Authorization: Bearer $ID_TOKEN" \
                "$BASE_URL/merchant-optimization?industry_group=3,16&volume_tier=7&portfolio=201&       
                metric=rev__gross_processing"
```

</details>

# Revenue Optimizer (Coming Soon)

Empowering Informed Decisions with Real-time Pricing Insights.

#### Overview

**Revenue Optimizer (Coming Soon)**, a dynamic pricing tool powered by TSG’s Acquiring Industry Metrics (AIM) platform, represents a cutting-edge solution providing businesses with a competitive edge. It offers real-time pricing data for key metrics, including merchant effective rate, discount rate, per transaction fees, and account fees. Revenue Optimizer empowers organizations and their partners with the benchmarks required to optimize both go-to-market and back-book pricing tactics and support data-driven decision-making.

#### Endpoint
To access Revenue Optimizer data, you can use the following HTTP request:
```sh
        curl -H "Authorization: Bearer $ID_TOKEN" "$BASE_URL/embedded-pricing?metrics=volume,volume,rev__gross,rev__gross_processing,rev__discount,rev__transaction__fees,rev__other__fees,rev__account_fees_annual_and_monthly,rev__equipment_and_other&filter=&normalizations=merchant,transaction,volume,volume,volume,transaction,transaction,merchant,merchant&vintage=N"
```

#### Parameters
<details markdown='1'><summary>List of query parameters</summary>

##### filter: 
You can apply filters to narrow down the data based on your requirements. If no filter is needed, leave this parameter empty. You can filter by the following criteria:

Volume Tier: Filter data by volume tier.
Industry Group: Filter data by industry group.
Industry: Filter data by industry.
Region: Filter data by region.
State: Filter data by state.
Vintage: Filter by “old” and “new”

If no specific filter is required, you may leave the filter parameter empty.

##### Merchant Vintage Options
- `New Merchants` : To focus on newly boarded merchants, use **vintage=N**. This option will include merchants onboarded only in the most recent three years.

- `All Merchants` : To focus on all merchants, use **vintage=A** . This options will include all vintage years.

##### Volume Tier Options

- By default, if no volume-tier-id is provided as a query parameter, all volume tiers up to $50 million will be used, representing volume-tier IDs 1 to 14.

- To specify a volume tier, you must include the volume-tier-id in the query parameters.


#### Conclusion
**Revenue Optimizer** presents an indispensable tool for accessing and harnessing real-time pricing data for your business and partners. Leverage this robust solution to fine-tune pricing strategies and elevate the precision of financial decision-making within your organization.

</details>





<footer><p style='text-align:center'>© The Strawhecker Group. All Rights Reserved.</p></footer>

<script src="./README.js"></script>

Welcome to the *AIM API - Alpha*!

# Alpha Notice

The AIM API is in an "alpha stage" to gather customer feedback. While in
alpha, the API may change in backwards incompatible ways to accommodate for
fixes and additions. Breaking changes will be communicated to the primary API contact
at least 5 business days in advance.

TSG reserves the right to determine what constitutes a breaking changes. A
definition of "breaking changes" will be made available before formal
release.

# API Discovery

In order to reduce client coupling, the AIM API provides an API discovery
document available at:

<a class="discovery-config-url"></a>

<pre><code id="discovery-config"></code></pre>

The primary attributes of interest is the `urls` object, which provides static
names to full or partial URLs.

# Authentication

The AIM API leverages [Firebase
Authentication](https://firebase.google.com/docs/auth) to securely
authenticate services and users. To enable API usage, service accounts are
created and used to generate a secret refresh token that is given to the
primary API contact.

These Refresh Tokens do not expire and can be used to retrieve short lived Access
Tokens. Access Tokens are used to directly communicate with the AIM API,
which will validate the Access Token.

In short, the authentication flow looks like the following:
1. Exchange a Refresh Token for an Access Token with Firebase
2. Use the Access Token with the AIM API
3. Repeat step 1 as the previous Access Token expires

![Authentication Flow](./authentication_flow.png)

Once acquired, the Access Token must be sent in the `Authorization` HTTP
Header as a `Bearer` token.

As Access Tokens are short lived (1 hour as of writing), a new one must be
fetched before expiration and replaced in requests to the API. Access Tokens
are [JSON Web Tokens](https://jwt.io/), so any standard JWT libary can be
used to decode them and inspect the `exp` entry for a Unix timestamp after
which the token will be rejected by the API. A number of JWT libraries are
referenced in the link above.

## Obtain an Access Token

In order to obtain an Access Token, we'll use the `accessToken` url from the
[Discovery document](#api-discovery), which allows us to exchange our
Refresh Token for a fresh Access Token.

<a class="accessToken-url"></a>

We'll make a POST request with the following payload, injecting the Refresh
Token as specified: `{"grant_type": "refresh_token", "refresh_token": <API
Key>}`. We'll extract the `id_token` field from the response, which contains
the Access Token, which can then be sent to the API.

For example, with `curl` to make the request and `jq` to extract the field:

```sh
ACCESS_TOKEN_URL="<Access Token Discovery URL>"
API_KEY="<Refresh Token>"
curl -fsSl -XPOST \
     -H "Content-Type: application/json" \
     -d "{\"grant_type\": \"refresh_token\", \"refresh_token\": \"$API_KEY\"}" \
     "$ACCESS_TOKEN_URL" \
     | jq -r '.id_token'
```

You now have an access token that can be used with the AIM API!

## Abuse and Privacy

In order to prevent abuse and data leaks, Refresh Tokens must be stored
securely. In particular, avoid unneeded sharing of Refresh Tokens or storing
them in source files/source control.

If you suspect your refresh token has been compromised, contact [Josh
Istas](mailto:jistas@thestrawgroup.com) at TSG as soon as possible. If abuse
is suspected, TSG may disable Refresh Tokens immediately and follow up with
the API contact.

# HTTP API

The AIM API is available at `https://aim.thestrawgroup.com/api/warehouse/v1`.

## Query API

The Query API is the primary tool provided by the AIM API. It provides
powerful data analysis across multiple dimensions of the AIM dataset.

The Query API is comprised of 4 primary components:
- Aggregations
- Attributes
- Metrics
- Normalizations

Each component has a discovery endpoint to obtain the available items
with full metadata.

<a class="warehouse-url"></a>

### Aggregation

Abstract aggregation operation.
    

<details markdown='1'><summary>Aggregations</summary>

#### None



#### 3 Month Moving Average

Periods = 3, Frequency = Month
    

#### 6 Month Moving Average

Periods = 6, Frequency = Month
    

#### 12 Month Moving Average

Periods = 12, Frequency = Month
    

#### 18 Month Moving Average

Periods = 18, Frequency = Month
    

</details>

### Attributes

Attribute base class.
Metrics are columns of interest (Ex. Volume, Net Revenue, Processing Cost) that are co-tabulated with
attribute columns (Ex. Date, Card, Region) that are used to filter or group the metric.

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

#### Average Ticket Tier

A merchant's ticket tier is based on its **average** number of transactions (or "tickets")
over a rolling 12 month period.

#### Annual Volume Tier

A merchant's volume tier is based on its **total** volume over a rolling 12 month period.
    

#### Region

Geographic region of the transaction.
Canada is a region.

#### State

U.S. State of the transaction

#### ZIP

Zip code of the transaction

#### MSA

City of the transaction

#### Sales Model

Sales model code

#### Industry Classification Type

Industry Classification Type. Currently this is either MCC or SIC.
    

#### Industry Group

Hierarchical grouping of Industries
    

#### Industry

Industry the merchant belongs to.
    

#### Portfolio

A grouping of merchants within an organization.
    

#### Data Month

Date is one of the AIM required attributes.
Traditionally date has been by month due to month being the frequency of the aim
application, though other aggregation levels are possible and may show up in the
future. The term era is used to denote a chunk of time. Ex. The month of June, as
opposed to June 1.

#### Standalone Merchants

Binary on if the merchant is part of a chain or not.

#### Vintage

Year merchant entered the market

</details>

### Metrics

Base metric class.
    

<details markdown='1'><summary>Metrics</summary>

#### COS Total Processing Fees

Processing Cost
Contains card components only

#### Total Cost of Sales

Total Cost
:= Total Cost Card + Total Cost Noncard

#### Gross Revenue

Gross Revenue
:= Gross Revenue Card + Gross Revenue Noncard
Contains card and noncard components

#### Gross Processing Revenue

Gross Processing Revenue
Contains card components only

#### Net Revenue

Net Revenue
:= Net Revenue Card + Net Revenue Noncard
Contains card and noncard components

#### Net Processing Revenue

Net Processing Revenue
Contains card components only

#### COS Association Fees, Assessments, and SWITCH Fees

Association And Switch Fees Cost
No card components

#### COS Association Fees & Assessments

Association Fees Cost

#### COS SWITCH Fees

Switch Fees Cost

#### COS Interchange Fees

Interchange Fees Cost
No card components

#### COS Other Processing Fees

Other Fees Cost
No card components

#### Other COS

Other Cost
No card components

#### Residuals Paid

Residuals Cost
No card components

#### Legacy Account Annual Fees Revenue

Legacy Account Annual Fees Revenue
No card components

#### Monthly Legacy Account Fees

Legacy Account Monthly Fees Revenue
No card components

#### Discount Revenue

Discount  Revenue
Contains card components only

#### Equipment & Other Income

Equipment and Other Revenue
Contains card components only

#### Gross Profit

Gross Profit Revenue
Contains card components only

#### Legacy Account Annual and Monthly Fees Revenue

Legacy Account Annual and Monthly Fees Revenue
Contains card components only

#### Other Fee Revenue

Other Fees Revenue
No card components

#### PCI Annual And Monthly Fees Revenue

PCI Annual And Monthly Fees Revenue
No card components

#### Transaction Fee Revenue

Transaction Fees Revenue
No card components

#### Transactions

Transaction
Contains card components only

#### Volume

Volume
Contains card components only

#### Account Attrition



#### New Accounts Added



#### Gross Volume Attrition



#### Change in Retained Account Volume



#### Volume Net Attrition



#### New Volume Added



#### Net Revenue Gross Attrition



#### Change in Retained Account Net Revenue



#### Net Revenue Net Attrition



#### New Net Revenue Added



#### Average Attrited Account Size



#### Average Retained Account Size



#### Average New Account Size



#### Average Net Revenue BPS on Attrited Accounts



#### Average Net Revenue BPS on Retained Accounts (Pre Change)



#### Average Net Revenue BPS on Retained Accounts (Post Change)



#### Average Net Revenue BPS on New Accounts

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

<script src="./README.js"></script>


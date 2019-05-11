""" The AIM API provides powerful market analysis.
"""
import json
from base64 import urlsafe_b64decode
from datetime import datetime, timedelta

import requests

CONFIG_URL_FMT = "https://storage.googleapis.com/public.{app_origin}/config/api.json"
DEFAULT_APP_ORIGIN = "aim.thestrawgroup.com"


class Token:
    """ Token provides helpers around JWT string parsing.
    """

    def __init__(self, jwt_str):
        self.jwt_str = jwt_str
        # Check for expiration
        tok = self.jwt_str.split(".")[1]
        # Add back the b64 omitted padding (JWT spec excludes it for URL safe values)
        tok += "=" * ((4 - len(tok) % 4) % 4)
        meta = json.loads(self._base64urldecode(tok))
        self.exp = datetime.utcfromtimestamp(meta["exp"])
        self.email = meta["email"]

    @property
    def ttl(self):
        return self.exp - datetime.utcnow()

    @staticmethod
    def _base64urldecode(s):
        """ https://www.rfc-editor.org/rfc/rfc7515.html#appendix-C
        """
        rem = len(s) % 4
        if rem == 2:
            s += "=="
        elif rem == 3:
            s += "="
        elif rem != 0:
            raise ValueError("Illegal base64url string!")
        return urlsafe_b64decode(s.encode("utf-8"))

    def __str__(self):
        return self.jwt_str


class Client:
    """ Client provides authenticated access to the AIM API.
    """

    def __init__(self, api_key, app_origin=DEFAULT_APP_ORIGIN):
        self._token = None
        self.api_key = api_key
        self.app_origin = app_origin
        # Load additional API config
        config = requests.get(CONFIG_URL_FMT.format(app_origin=self.app_origin)).json()
        self._id_token_url = config["idTokenUrl"]
        self.app_id = config["appId"]

    def _fetch_token(self):
        id_token_resp = requests.post(
            self._id_token_url,
            json={"grant_type": "refresh_token", "refresh_token": self.api_key},
        )
        if id_token_resp.status_code != 200:
            raise ValueError(f"Getting an ID token failed: {id_token_resp.content}")
        return id_token_resp.json()["id_token"]

    def _token_needs_refresh(self):
        if self._token is None:
            return True
        if self._token.ttl < timedelta(minutes=1):
            return True
        return False

    @property
    def token(self):
        """ Get an ID token for use in the "Authorization" header as a "Bearer" token.
        """
        if self._token_needs_refresh():
            self._token = Token(self._fetch_token())
        return str(self._token)

#!/usr/local/bin/python3.7
import blocksmith
import cgi
#import string
#Print necessary headers.
print(chr(10))
form = cgi.FieldStorage()
svg = form.getvalue('svg')
kg = blocksmith.KeyGenerator()
kg.seed_input(svg)
key = kg.generate_key()
adressBitcoin = blocksmith.BitcoinWallet.generate_address(key)
adressEtherium = blocksmith.EthereumWallet.generate_address(key) 
print(key+","+adressBitcoin+","+adressEtherium)

#!/usr/local/bin/python3.7
#import requests
import sys
#sys.path.append("/var/www/html/")
import cgi
import string
import random
import os
import io
import sys
import cgitb
cgitb.enable()
print(chr(10))
form = cgi.FieldStorage()
svg = form.getvalue('svg')
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF, renderPM
drawing = svg2rlg(io.BytesIO(bytes(svg,"utf-8")))
dS = renderPDF.drawToString(drawing)
print(dS.decode("windows-1252"))

# Client Location
The client can be found live and running at https://davinci-pcde-client.logicahealth.org/
# The client can also be run locally
- Running locally will allow for some simple testing however, it is not possible for the RI to post a the PCDE bundle to a locally running instance of the client
# Requirements
- python 3.7
- pip3
# Setting up the app
- pip3 install flask
- pip3 install requests
# Running the client
## With Docker
- docker build -t pcde-client:latest .
- docker-compose up
- The application will be live at http://0.0.0.0:5000/
## With Flask
- export FLASK_APP=flask_app.py
- flask run
- The application will be live at http://localhost:5000
# Using the client
The Client interacts with the reference implementation server which can be found at: https://davinci-pcde-ri.logicahealth.org/
It is equipped with several searches to make it easy to find, bundles based on ID, patients based on demographics, or
to generate a custom CommunicationRequest to retrieve a Communication with the PCDE bundle attached.
Each of these features can be located by clicking on the corresponding button at the top of the site.
There are several test examples already built into the server for interacting with it.
- PCDE Bundle
  * Search with the ID 1
- Patient
  * Search with names Joe Smith or Jeff Smith
  * Jeff Smith has two results so the birthdays can be used to refine the search: 1980-01-12 or 1980-01-13
- CommunicationRequest
  * Only one PCDE bundle currently exists on the server so the patient ID needs to be 14
  * The Organization IDs should be 16 and 17
- Bundle Communication Request
  * Simulates a real PCDE interaction
  * When interacting with the PCDE RI there are four potential responses
  * * First, searching for the patient Joe Smith. This will result in the  PCDE bundle being posted back to the client. After a few seconds, the Get Communication Button can be pressed to pull the posted bundle to be displayed
  * * Second, searching for the patient Jeff Smith. This will result in a 413 because multiple patients will match
  the demographics.
  * * Third, searching for the patient Jeff Smith with the birthday or ID included will result in a 200, but neither one has a PCDE bundle so when the Get Communication Button is pressed it will result in a 404
  * * Fourth, searching for any patient not in the will result in a 404
# How the client works
The client runs on its own server locally and the requests are made through the backend. The required
fields for each search are combined into a single request to be made to the reference server. Some of
the results are processed before being sent to the front end again to be displayed.
The CommunicationRequest has the most complex processing behind the scenes. When the ID's are sent
to the client server, it generates a CommunicationRequest and sends the request to the reference server.
The reference server generates a Communication response based on the request and attaches the PCDE bundle
after encoding it in base64 formatting. Communication is received by the client and processed into
individual parts. It decodes the PCDE bundle and sends it along with the rest of the communication to the
front end to be displayed.

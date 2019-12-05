# davinci-pcde-ri
Reference Implementation for the Da Vinci Payor Coverage Decision Exchange specification
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

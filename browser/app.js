
// Our app is written in ES3 so that it works in older browsers!

function createRenderer(id) {
  const output = id ? document.getElementById(id) : document.body;
  console.log(output);
  return function(data) {
    output.innerText = data && typeof data === "object"
      ? JSON.stringify(data, null, 4)
      : String(data);
  };
}

function renderPatient() {
  const output = document.getElementById("patient");
  console.log(output);
  return function(data) {
    console.log(data);
    let text = '';

    if (data && typeof data === "object") {
      text = data.text.div;
      text = `<button onClick='window.app.updatePatientPhone("${data.id}", "5", "${data.telecom[5].id}", "${data.meta.versionId}", "505-232-5932")'>Update phone number</button>` + text;
    } else {
      text = String(data);
    }

    output.innerHTML = text;
  };
}


function renderAppt() {
  const output = document.getElementById("appointments");
  let text = '';

  return function(data) {
//     console.dir(data);

    if (data && typeof data === "object") {
      const appt = data.entry[0].resource;
      console.log(data);
      text = appt.text.div;

      console.log(appt.status);
      if (appt.status === "checked-in") {
        text = `<button onClick='window.app.updateApptStatus(${appt.id}, ${appt.meta.versionId}, "fulfilled")'>Set fulfilled</button>` + text;
      } else {
        text = `<button onClick='window.app.updateApptStatus(${appt.id}, ${appt.meta.versionId}, "checked-in")'>Check in</button>` + text;
      }
    } else {
      text = String(data);
    }

    output.innerHTML = text;
  };
}

function renderQuestionnaireResponse() {
  const output = document.getElementById("questionnaireResponse");
  let text = '';

  return function(data) {
    console.log(JSON.stringify(data));

    if (data && typeof data === "object") {

      const questionnaireResponse = data.entry[0].resource;
      console.log(questionnaireResponse);

      text = questionnaireResponse.text.div;
    } else {
      text = String(data);
    }

    output.innerHTML = text;
  };
}

function renderQuestionnaire() {
  const output = document.getElementById("questionnaire");
  let text = '';

  return function(data) {
    console.log(JSON.stringify(data));
    console.log(data);

    if (data && typeof data === "object") {
      text = `<strong>Status:</strong> ${data.status}<br />` + text;
      text = `<strong>Title:</strong> ${data.title}<br />` + text;
    } else {
      text = String(data);
    }

    output.innerHTML = text;
  };
}

function App(client) {
  this.client = client;
}

App.prototype.fetchPatient = function() {
  var render = renderPatient();
  render("Loading patient...");
  return this.client.request("Patient/12724066").then(render, render);
};

App.prototype.fetchAppointments = function() {
  var render = renderAppt();
  render("Loading appointments...");
  return this.client.request("Appointment?patient=12724066&date=ge2020-01-24T00:00:00.000Z&date=lt2020-01-25T00:00:00.000Z").then(render, render);
};

App.prototype.fetchQuestionnaireResponse = function() {
  var render = renderQuestionnaireResponse();
  render("Loading questionnaire response...");
  return this.client.request("QuestionnaireResponse?patient=12724066").then(render, render);
};

App.prototype.fetchQuestionnaire = function() {
  var render = renderQuestionnaire();
  render("Loading questionnaire...");
  return this.client.request("Questionnaire/SH-12724066").then(render, render);
};

App.prototype.updatePatientPhone = function(patientId, telecomIdx, telecomId, version, phone) {
  console.log(patientId);
  console.log(phone);

  var respond = function(result) { console.log(result); };

  this.client.patch(
    `Patient/${patientId}`,
    [
      { "op": "replace", "path": `/telecom/${telecomIdx}/value`, "value": phone },
      { "op": "test", "path": `/telecom/${telecomIdx}/id`, "value": telecomId },
    ],
    { headers: { "If-Match": `W/"${version}"` } }
  ).then(respond, respond);
}


App.prototype.updateApptStatus = function(id, version, status) {
  console.log(id);
  console.log(status);

  var respond = function(result) { console.log(result); };

  this.client.patch(
    `Appointment/${id}`,
    [{ "op": "replace", "path": "/status", "value": status }],
    { headers: { "If-Match": `W/"${version}"` } }
  ).then(respond, respond);
}

App.prototype.fetchCurrentUser = function() {
  var render = createRenderer("user");
  render("Loading...");
  return this.client.user.read().then(render, render);
};

App.prototype.request = function(requestOptions, fhirOptions) {
  var render = createRenderer("output");
  render("Loading...");
  return this.client.request(requestOptions, fhirOptions).then(render, render);
};

App.prototype.renderContext = function() {
  return Promise.all([
    this.fetchPatient(),
    this.fetchAppointments(),
    this.fetchQuestionnaireResponse(),
    this.fetchQuestionnaire(),
  ]);
};

App.prototype.setLabel = function(containerId, label) {
  document.getElementById(containerId).previousElementSibling.innerText = label;
};

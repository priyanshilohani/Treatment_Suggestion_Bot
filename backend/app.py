from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEndpoint
from langchain.chains import RetrievalQA
import spacy
import re

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return "Flask backend is running!"

FAISS_INDEX_PATH = "faiss_index"

huggingface_api_key = 

llm = HuggingFaceEndpoint(
    repo_id="HuggingFaceH4/zephyr-7b-beta",
    temperature=0.3,
    huggingfacehub_api_token=huggingface_api_key,
    max_new_tokens=200  
)

spacy_model = spacy.load("en_core_web_sm")

def clean_text(text):
    if not isinstance(text, str):
        text = str(text) if text is not None else ""
    return re.sub(r"\s+", " ", text).strip()

def split_into_chunks(text, max_chunk_size=512):
    doc = spacy_model(text)
    sentences = [sent.text.strip() for sent in doc.sents]
    chunks, current_chunk = [], ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= max_chunk_size:
            current_chunk += " " + sentence
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

@app.route('/suggest', methods=['POST'])
def suggest_treatment():
    data = request.json

    severity = data.get("severity", "")
    problem = data.get("problem", "")
    symptoms = data.get("symptoms", "")

    # Combine into base context
    base_context = (
        f"Severity: {severity}\n"
        f"Problem: {problem}\n"
        f"Symptoms: {symptoms}"
    )

    # Clean + chunk input context
    cleaned_context = clean_text(base_context)
    chunks = split_into_chunks(cleaned_context)

    # Build embeddings and vector store
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector_store = FAISS.from_texts(chunks, embeddings)
    vector_store.save_local(FAISS_INDEX_PATH)

    vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
    retriever = vector_store.as_retriever()

    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

    illness_query = (
        "What possible illnesses might the patient have based on the given severity, problem, and symptoms?"
    )

    treatment_query = (
        "Suggest a suitable over-the-counter or prescription medicine (name, dosage, frequency), a general treatment plan, home remedies, and any precautions for the patient's condition."
    )

    remedy_query = (
        "Suggest helpful home remedies and general rest advice based on the symptoms."
    )

    possible_illness = qa_chain.run(illness_query)
    medical_treatment = qa_chain.run(treatment_query)
    home_remedy = qa_chain.run(remedy_query)

    final_response = (
        "Possible Illness:\n"
        f"{possible_illness.strip()}\n\n"
        "Medical Treatment / Prescription:\n"
        f"{medical_treatment.strip()}\n\n"
        f"{home_remedy.strip()}"
    )

    context = f"{base_context}\nAdvice: {final_response}"

    return jsonify({"suggestion": final_response, "context": context})


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message", "")
    context = data.get("context", "")

    chunks = split_into_chunks(clean_text(context))

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector_store = FAISS.from_texts(chunks, embeddings)
    vector_store.save_local(FAISS_INDEX_PATH)

    vector_store = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vector_store.as_retriever())

    full_query = f"{user_message}\n\nContext:\n{context}"
    #reply = qa_chain.run(full_query)
    reply = qa_chain.run(user_message)

    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='localhost')

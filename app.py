from flask import Flask, render_template, jsonify, request, redirect, session
import random

app = Flask(__name__)
app.config["SECRET_KEY"] = "super_secret_key_123"   # REQUIRED for session

@app.route("/", methods=["GET", "POST"])
def module_page():
    if request.method == "POST":
        module = request.form.get("module").strip().lower()
        session["module"] = module
        return redirect("/wheel")
    return render_template("module.html")

@app.route("/wheel")
def wheel():
    if "module" not in session:
        return redirect("/")
    return render_template("index.html")


@app.route("/spin")
def spin():
    module = session.get("module", "").lower()

    sprechen_offers = [
        "10% Discount",
        "20% Discount",
        "15% Discount",
        "Next Registration 50% Discount",
        "Registration for ₹1700",
        "Registration for ₹1500"
    ]

    other_offers = [
        "10% Discount",
        "20% Discount",
        "15% Discount",
        "Next Registration 50% Discount",
        "Registration for ₹1000",
        "Registration for ₹1200",
        "Registration for ₹1300"
    ]

    if "sprechen" in module:
        offers = sprechen_offers
        base_price = 2000
    else:
        offers = other_offers
        base_price = 1500

    index = random.randint(0, len(offers) - 1)

    return jsonify({
        "offers": offers,
        "index": index,
        "module": module,
        "base_price": base_price
    })


if __name__ == "__main__":
    app.run(debug=True)

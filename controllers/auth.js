const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config()

const  {User}  = require("../models/user");
const { ctrlWrapper } = require("../helpers/index");
const HttpError = require('../helpers/HttpError')

const { SECRET_KEY } = process.env;

const register = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        throw new HttpError(409, "Email in use");
    }
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ ...req.body, password: hashPassword });

    const id = newUser._id;
    const token = jwt.sign({ id }, SECRET_KEY, { expiresIn: "23h" });
    await User.findByIdAndUpdate(id, { token });

    res.status(201).json({
        user: {
            email: newUser.email,
            subscription: newUser.subscription,
        },
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new HttpError(401, "Email or password is wrong");
    }

    const compareResult = await bcrypt.compare(password, user.password);

    if (!compareResult) {
        throw new HttpError(401, "Email or password is wrong");
    }

    const id = user._id;
    const token = jwt.sign({ id }, SECRET_KEY, { expiresIn: "23h" });
    await User.findByIdAndUpdate(id, { token });
    res.status(200).json({
        token,
        user: {
            email: user.email,
            subscription: user.subscription,
        },
    });
};

const logout = async (req, res) => {
    const { id } = req.user;
    await User.findByIdAndUpdate(id, { token: "" });
    res.status(204).json();
};
const getCurrent = async (req, res) => {
    const { email, subscription } = req.user;
    res.json({
        email,
        subscription,
    });
};
const updateSubscription = async (req, res) => {
    const { _id } = req.user;
    console.log(_id);
    const result = await User.findByIdAndUpdate(_id, req.body, { new: true });
    res.json(result);
};

module.exports = {
    register: ctrlWrapper(register),
    login: ctrlWrapper(login),
    getCurrent,
    logout: ctrlWrapper(logout),
    updateSubscription: ctrlWrapper(updateSubscription),
};
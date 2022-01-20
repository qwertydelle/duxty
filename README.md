# Duxty
[![npm version](https://badge.fury.io/js/duxty.svg)](https://badge.fury.io/js/duxty)

## Introduction

Duxty is a command line tool that makes it easy to setup discord bots

## Installation

You can install duxty by using "npm": 
```bash
npm install -g duxty
```
This was install duxty globally which allows you to use ``duxt`` 

## Usage

Starting a new project can be done by using:

```bash
duxt
```

You can also pass in a token for your project by using:

```bash
duxt -t <token>
```
or

```bash
duxt --token <token>
```

Duxty also allows you to set a default token for all of your projects. This can be done by using:

```bash
duxt token <token>
```
Duxty will automatically use the token provided as an argument. If that is not found, it falls back to using the default token.
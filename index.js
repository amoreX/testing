#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
var bcrypt = require("bcryptjs");
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv = require("dotenv");
// Load environment variables
dotenv.config();
// Initialize Supabase client
var supabaseUrl = "https://fyhwbvtutrlenkwjiffi.supabase.co";
var supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aHdidnR1dHJsZW5rd2ppZmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTg5ODMsImV4cCI6MjA2MjQ3NDk4M30.o0u2JLKF8sxBzEP4VCCQIOjb8KKkxn7UyOltV8qo5vI";
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing required Supabase environment variables");
}
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Create MCP server
var server = new mcp_js_1.McpServer({
    name: "user-management-server",
    version: "1.0.0",
    description: "MCP server for user management with Supabase integration",
});
// Tool: Get all users
server.tool("get_users", {}, // Empty schema for no parameters
function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, data, error, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, supabase.from("users").select("*")];
            case 1:
                _a = _b.sent(), data = _a.data, error = _a.error;
                if (error) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error fetching users: ".concat(error.message),
                                },
                            ],
                        }];
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(data, null, 2),
                            },
                        ],
                    }];
            case 2:
                err_1 = _b.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Internal server error: ".concat(err_1),
                            },
                        ],
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Tool: Get user by name or email
server.tool("get_user", {
    identifier: zod_1.z.string().describe("The user's name or email address"),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var _c, data, error, err_2;
    var identifier = _b.identifier;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                return [4 /*yield*/, supabase
                        .from("users")
                        .select("*")
                        .or("name.ilike.%".concat(identifier, "%,email.ilike.%").concat(identifier, "%"))];
            case 1:
                _c = _d.sent(), data = _c.data, error = _c.error;
                if (error) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error fetching user: ".concat(error.message),
                                },
                            ],
                        }];
                }
                if (!data || data.length === 0) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "No user found with name or email containing: ".concat(identifier),
                                },
                            ],
                        }];
                }
                if (data.length === 1) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(data[0], null, 2),
                                },
                            ],
                        }];
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Multiple users found:\n".concat(JSON.stringify(data.map(function (u) { return ({ id: u.id, name: u.name, email: u.email }); }), null, 2)),
                            },
                        ],
                    }];
            case 2:
                err_2 = _d.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Internal server error: ".concat(err_2),
                            },
                        ],
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Tool: Create new user
server.tool("create_user", {
    email: zod_1.z.string().email().describe("User's email address"),
    password: zod_1.z.string().min(6).describe("User's password (will be hashed)"),
    name: zod_1.z.string().describe("User's full name"),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var hashedPassword, _c, data, insertError, err_3;
    var email = _b.email, password = _b.password, name = _b.name;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                return [4 /*yield*/, bcrypt.hash(password, 10)];
            case 1:
                hashedPassword = _d.sent();
                return [4 /*yield*/, supabase
                        .from("users")
                        .insert([
                        {
                            email: email,
                            name: name,
                            password: hashedPassword,
                            current_mental_state: "",
                            recommendations: [],
                        },
                    ])
                        .select()
                        .single()];
            case 2:
                _c = _d.sent(), data = _c.data, insertError = _c.error;
                if (insertError) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error creating user: ".concat(insertError.message),
                                },
                            ],
                        }];
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "User created successfully: ".concat(JSON.stringify({
                                    id: data.id,
                                    email: data.email,
                                    name: data.name,
                                    created_at: data.created_at,
                                }, null, 2)),
                            },
                        ],
                    }];
            case 3:
                err_3 = _d.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Internal server error: ".concat(err_3),
                            },
                        ],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Tool: Update user mental state
server.tool("update_mental_state", {
    identifier: zod_1.z.string().describe("The user's name or email address"),
    mental_state: zod_1.z.string().describe("The new mental state description"),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var _c, users, findError, user, _d, data, error, err_4;
    var identifier = _b.identifier, mental_state = _b.mental_state;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                return [4 /*yield*/, supabase
                        .from("users")
                        .select("*")
                        .or("name.ilike.%".concat(identifier, "%,email.ilike.%").concat(identifier, "%"))];
            case 1:
                _c = _e.sent(), users = _c.data, findError = _c.error;
                if (findError) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error finding user: ".concat(findError.message),
                                },
                            ],
                        }];
                }
                if (!users || users.length === 0) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "No user found with name or email containing: ".concat(identifier),
                                },
                            ],
                        }];
                }
                if (users.length > 1) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Multiple users found. Please be more specific:\n".concat(JSON.stringify(users.map(function (u) { return ({ name: u.name, email: u.email }); }), null, 2)),
                                },
                            ],
                        }];
                }
                user = users[0];
                return [4 /*yield*/, supabase
                        .from("users")
                        .update({ current_mental_state: mental_state })
                        .eq("id", user.id)
                        .select()
                        .single()];
            case 2:
                _d = _e.sent(), data = _d.data, error = _d.error;
                if (error) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error updating mental state: ".concat(error.message),
                                },
                            ],
                        }];
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Mental state updated successfully for user: ".concat(data.name, " (").concat(data.email, ")"),
                            },
                        ],
                    }];
            case 3:
                err_4 = _e.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Internal server error: ".concat(err_4),
                            },
                        ],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Tool: Add recommendation to user
server.tool("add_recommendation", {
    identifier: zod_1.z.string().describe("The user's name or email address"),
    recommendation: zod_1.z.string().describe("The recommendation to add"),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var _c, users, findError, user, currentRecommendations, updatedRecommendations, _d, data, updateError, err_5;
    var identifier = _b.identifier, recommendation = _b.recommendation;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                return [4 /*yield*/, supabase
                        .from("users")
                        .select("*")
                        .or("name.ilike.%".concat(identifier, "%,email.ilike.%").concat(identifier, "%"))];
            case 1:
                _c = _e.sent(), users = _c.data, findError = _c.error;
                if (findError) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error finding user: ".concat(findError.message),
                                },
                            ],
                        }];
                }
                if (!users || users.length === 0) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "No user found with name or email containing: ".concat(identifier),
                                },
                            ],
                        }];
                }
                if (users.length > 1) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Multiple users found. Please be more specific:\n".concat(JSON.stringify(users.map(function (u) { return ({ name: u.name, email: u.email }); }), null, 2)),
                                },
                            ],
                        }];
                }
                user = users[0];
                currentRecommendations = user.recommendations || [];
                updatedRecommendations = __spreadArray(__spreadArray([], currentRecommendations, true), [
                    recommendation,
                ], false);
                return [4 /*yield*/, supabase
                        .from("users")
                        .update({ recommendations: updatedRecommendations })
                        .eq("id", user.id)
                        .select()
                        .single()];
            case 2:
                _d = _e.sent(), data = _d.data, updateError = _d.error;
                if (updateError) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error adding recommendation: ".concat(updateError.message),
                                },
                            ],
                        }];
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Recommendation added successfully to user: ".concat(data.name, " (").concat(data.email, "). Total recommendations: ").concat(updatedRecommendations.length),
                            },
                        ],
                    }];
            case 3:
                err_5 = _e.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Internal server error: ".concat(err_5),
                            },
                        ],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Tool: Delete user
server.tool("delete_user", {
    identifier: zod_1.z.string().describe("The user's name or email address"),
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var _c, users, findError, user, error, err_6;
    var identifier = _b.identifier;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                return [4 /*yield*/, supabase
                        .from("users")
                        .select("*")
                        .or("name.ilike.%".concat(identifier, "%,email.ilike.%").concat(identifier, "%"))];
            case 1:
                _c = _d.sent(), users = _c.data, findError = _c.error;
                if (findError) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error finding user: ".concat(findError.message),
                                },
                            ],
                        }];
                }
                if (!users || users.length === 0) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "No user found with name or email containing: ".concat(identifier),
                                },
                            ],
                        }];
                }
                if (users.length > 1) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Multiple users found. Please be more specific:\n".concat(JSON.stringify(users.map(function (u) { return ({ name: u.name, email: u.email }); }), null, 2)),
                                },
                            ],
                        }];
                }
                user = users[0];
                return [4 /*yield*/, supabase.from("users").delete().eq("id", user.id)];
            case 2:
                error = (_d.sent()).error;
                if (error) {
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error deleting user: ".concat(error.message),
                                },
                            ],
                        }];
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "User ".concat(user.name, " (").concat(user.email, ") deleted successfully"),
                            },
                        ],
                    }];
            case 3:
                err_6 = _d.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Internal server error: ".concat(err_6),
                            },
                        ],
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Resource: User list
server.resource("users", "users://list", function (uri) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, data, error, err_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, supabase
                        .from("users")
                        .select("id, email, name, created_at")];
            case 1:
                _a = _b.sent(), data = _a.data, error = _a.error;
                if (error) {
                    throw new Error(error.message);
                }
                return [2 /*return*/, {
                        contents: [
                            {
                                uri: uri.href,
                                mimeType: "application/json",
                                text: JSON.stringify(data, null, 2),
                            },
                        ],
                    }];
            case 2:
                err_7 = _b.sent();
                return [2 /*return*/, {
                        contents: [
                            {
                                uri: uri.href,
                                mimeType: "text/plain",
                                text: "Error fetching users: ".concat(err_7),
                            },
                        ],
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Start the server
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    console.error("User Management MCP Server running on stdio");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);

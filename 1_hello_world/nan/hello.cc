#include <nan.h>

void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  info.GetReturnValue().Set(Nan::New("world").ToLocalChecked());
}

void Init(v8::Local<v8::Object> exports) {
  exports->Set(Nan::New("hello").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(Method)->GetFunction());
}

NODE_MODULE(hello, Init)
// #include <node.h>
// #include <v8.h>

// using namespace v8;

// Handle<Value> Method(const Arguments& args) {
//   HandleScope scope;
//   return scope.Close(String::New("world"));
// }

// void Init(Handle<Object> exports) {
//   exports->Set(String::NewSymbol("hello"),
//       FunctionTemplate::New(Method)->GetFunction());
// }

// NODE_MODULE(hello, Init)

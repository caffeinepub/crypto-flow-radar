module {
  type OldActor = {
    nextImpulseId : Nat;
  };

  type NewActor = {};

  /// Ignore nextImpulseId from old actor and return empty actor.
  public func run(old : OldActor) : NewActor {
    {};
  };
};
